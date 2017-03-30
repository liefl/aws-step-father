const EventEmitter = require('events')
const StepChild = require('./step-child')

const EVENTS = {
  ERROR: 'err',
  SUCCESS: 'success',
  FAILURE: 'failure',
  HEARTBEAT: 'heartbeat',
  START: 'start'
}

const DEFAULT_POLL_INTERVAL = 65000
const DEFAULT_HEARTBEAT_INTERVAL = 10000

class StepFather extends EventEmitter {
  constructor (stepFunctions, options) {
    if (!stepFunctions) {
      throw new Error('Unable to create worker: Requires AWS stepFunctions instance.')
    }

    if (!options.executableMethod) {
      throw new Error('Unable to create worker: No executable method provided.')
    }

    if (!options.activityArn) {
      throw new Error('Unable to create worker: No activityArn provided.')
    }

    super()

    this.stepFunctions = stepFunctions
    this.executableMethod = options.executableMethod
    this.activityArn = options.activityArn
    this.workerName = options.workerName

    this.pollInterval = options.pollInterval || DEFAULT_POLL_INTERVAL
    this.heartbeatInterval = options.heartbeatInterval || DEFAULT_HEARTBEAT_INTERVAL
  }

  start () {
    this._getActivityTask()
    this.poller = setInterval(() => this._getActivityTask(), this.pollInterval)
  }

  stop () {
    clearInterval(this.poller)
  }

  _getActivityTask () {
    const params = {
      activityArn: this.activityArn,
      workerName: this.workerName
    }

    this.stepFunctions.getActivityTask(params, (error, data) => {
      if (error) {
        this._emitError(error, 'Failure to get activity task.')
      } else if (data && data.taskToken) {
        this._startActivityTask(data.taskToken, data.input)
      }
    })
  }

  _startActivityTask (taskToken, input) {
    this.stop()

    this.taskToken = taskToken
    this.taskHeartbeat = setInterval(() => this._sendHeartbeat(), this.heartbeatInterval)

    const child = new StepChild(this.executableMethod)

    this._emitStart(input)

    child.execute(input)
      .then((output) => this._sendSuccess(output))
      .catch((error) => this._sendFailure(error))
      .then(() => this._finishActivityTask())
  }

  _finishActivityTask () {
    if (this.taskHeartbeat) {
      clearInterval(this.taskHeartbeat)
      this.taskHeartbeat = null
    }

    this.taskToken = null
    this.start()
  }

  _sendSuccess (output) {
    const params = {
      taskToken: this.taskToken,
      output: output
    }

    this.stepFunctions.sendTaskSuccess(params, (error) => {
      if (error) this._emitError(error, 'Failure to send task success.')
      else this._emitSuccess(output)
    })
  }

  _sendFailure (error) {
    const params = {
      taskToken: this.taskToken,
      error: error
    }

    this.stepFunctions.sendTaskFailure(params, (error) => {
      if (error) this._emitError(error, 'Failure to send task failure.')
      else this._emitFailure(error)
    })
  }

  _sendHeartbeat () {
    const params = {
      taskToken: this.taskToken
    }

    this.stepFunctions.sendTaskHeartbeat(params, (error) => {
      if (error) this._emitError(error, 'Failure to send task hearbeat.')
      else this._emitHeartbeat()
    })
  }

  _emitFailure (error) {
    const params = {
      workerName: this.workerName,
      taskToken: this.taskToken,
      error: error
    }

    this.emit(EVENTS.FAILURE, params)
  }

  _emitSuccess (output) {
    const params = {
      workerName: this.workerName,
      taskToken: this.taskToken,
      output: output
    }

    this.emit(EVENTS.SUCCESS, params)
  }

  _emitError (error, cause) {
    const params = {
      workerName: this.workerName,
      taskToken: this.taskToken,
      error: error,
      cause: cause
    }

    this.emit(EVENTS.ERROR, params)
  }

  _emitHeartbeat () {
    const params = {
      workerName: this.workerName,
      taskToken: this.taskToken
    }

    this.emit(EVENTS.HEARTBEAT, params)
  }

  _emitStart (input) {
    const params = {
      workerName: this.workerName,
      taskToken: this.taskToken,
      input: input
    }

    this.emit(EVENTS.START, params)
  }
  
}

module.exports = StepFather