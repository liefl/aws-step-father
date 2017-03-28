# Step Father
Polling worker for AWS StepFunctions. 

```
const StepFather = require('aws-step-father')
const AWS = require('aws-sdk')
const stepFunctions = new AWS.StepFunctions()

const worker = new StepFather(stepFunctions, {
  activityArn: <string>,
  executableMethod: <function>,
  workerName: <string>,
  pollInterval: <integer>,
  heartbeatInterval: <integer>
})

worker.on('success', (data) => console.log(`Task ${data.taskToken} completed!`))

worker.start()
```

#### Options

`activityArn`: ARN string of activity (required)
`executableMethod`: Method that will be executed with activity input. Must return a Promise. (required)
`workerName`: Name of worker
`pollInterval`: Polling interval for tasks, defaults to 65000
`heartbeatInterval`: Heartbeat interval for tasks, defaults to 10000


### Events

`start`: Emitted on task start.
`success`: Emitted on task success.
`failure`: Emitted on task failure.
`error`: Emitted on communication error with StepFunctions API.
