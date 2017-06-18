import { EventEmitter } from 'events'
import { StepFunctions } from 'aws-sdk'

export type StepFatherHandler = (input: object) => Promise<object>

export interface StepFatherOptions {
  activityArn: string
  workerName?: string
  heartbeatInterval?: number
  delayInterval?: number
}

export default class StepFather extends EventEmitter {
  private stepFunctions: StepFunctions
  private handler: StepFatherHandler
  private options: StepFatherOptions
  private delay: NodeJS.Timer

  private static DEFAULT_OPTIONS = {
    heartbeatInterval: 10000,
    delayInterval: 60000,
    workerName: 'StepFather'
  }

  constructor (config: StepFunctions.ClientConfiguration, handler: StepFatherHandler, options: StepFatherOptions) {
    if (!config) {
      throw new Error('Unable to create StepFather, requires StepFunctions client configuration.')
    }

    if (!handler) {
      throw new Error('Unable to create StepFather, requires a task handler function.')
    }

    if (!options) {
      throw new Error('Unable to create StepFather, requires a options object.')
    }

    if (!options.activityArn) {
      throw new Error('Unable to create StepFather, requires a valid config object: activityArn missing.')
    }

    super()

    try {
      this.stepFunctions = new StepFunctions(config)
    } catch (e) {
      throw new Error('Unable to create StepFather, unable to instantiate stepFunctions with passed config: ' + e.message)
    }

    this.handler = handler
    this.options = Object.assign({}, StepFather.DEFAULT_OPTIONS, options)
  }

  public async start (): Promise<void> {
    try {
      const task = await this.getActivityTask()
      const execution = await this.executeTask(task)

      this.start()
    } catch (error) {
      this.emit('failure', { error })

      this.delay = setTimeout(() => this.start(), this.options.delayInterval)
    }
  }

  public stop (): void {
    clearTimeout(this.delay)
  }

  private async executeTask (task: StepFunctions.GetActivityTaskOutput): Promise<void> {
    const heartbeat = setInterval(() => this.sendTaskHeartbeat(task.taskToken), 1000)

    try {
      const json = JSON.parse(task.input)
      const response = await this.handler(json)
      const output = JSON.stringify(response)

      await this.sendTaskSuccess(task.taskToken, output)
    } catch (e) {
      await this.sendTaskFailure(task.taskToken, e.message)
    }

    clearInterval(heartbeat)
  }

  private getActivityTask (): Promise<StepFunctions.GetActivityTaskOutput> {
    const params: StepFunctions.GetActivityTaskInput = {
      activityArn: this.options.activityArn,
      workerName: this.options.workerName
    }

    return this.stepFunctions.getActivityTask(params).promise()
  }

  private sendTaskFailure (taskToken: string, error: string): Promise<StepFunctions.SendTaskFailureOutput> {
    const params: StepFunctions.SendTaskFailureInput = {
      taskToken,
      error
    }

    return this.stepFunctions.sendTaskFailure(params).promise()
  }

  private sendTaskSuccess (taskToken: string, output: string): Promise<StepFunctions.SendTaskSuccessOutput> {
    const params: StepFunctions.SendTaskSuccessInput = {
      taskToken,
      output
    }

    return this.stepFunctions.sendTaskSuccess(params).promise()
  }

  private sendTaskHeartbeat (taskToken: string): Promise<StepFunctions.SendTaskHeartbeatOutput> {
    const params: StepFunctions.SendTaskHeartbeatInput = {
      taskToken
    }

    return this.stepFunctions.sendTaskHeartbeat(params).promise()
  }

}