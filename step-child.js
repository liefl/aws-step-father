const CHARACTER_LIMIT = 255

class StepChild {
  constructor (exectuableMethod) {
    this.exectuableMethod = exectuableMethod
  }

  execute (input) {
    if (!this.exectuableMethod || typeof this.exectuableMethod !== 'function') {
      return Promise.reject('Activity failed because of a configuration error: No executable method provided.')
    }

    const sanitizedInput = this._sanitizeInput(input)
    const execution = this.exectuableMethod(sanitizedInput)

    if (!execution.then) {
      return Promise.reject('Activity executed, but failed because of a configuration error: Executable method must return a promise.')
    }

    return execution
      .then((output) => this._sanitizeOutput(output))
      .catch((error) => this._sanitizeError(error))
  }

  _sanitizeInput (input) {
    try {
      input = JSON.parse(input)
    } catch (error) {
      if (typeof input !== 'string') {
        input = {}
      }
    }

    return input
  }

  _sanitizeOutput (output) {
    if (typeof output === 'object') {
      output = JSON.stringify(output, null, 2)
    } else if (typeof output === 'string') {
      output = output.substring(0, CHARACTER_LIMIT)
    }

    return Promise.resolve(output)
  }

  _sanitizeError (error) {
    if (error instanceof Error) {
      error = error.message
    }

    if (typeof error === 'string') {
      error = error.substring(0, CHARACTER_LIMIT)
    } else {
      error = 'Unknown error.'
    }

    return Promise.reject(error)
  }

}

module.exports = StepChild