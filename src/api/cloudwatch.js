import { CloudWatchLogsClient, PutLogEventsCommand, CreateLogStreamCommand } from '@aws-sdk/client-cloudwatch-logs'

const client = new CloudWatchLogsClient({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.accessKeyId, secretAccessKey: process.env.secretAccessKey
  }
})

const logStreamName = new Date().getTime() + ''

const command = new CreateLogStreamCommand({
  logStreamName,
  logGroupName: '/mobile/manager'
})
const _createLogStream = client.send(command).then(() => console.log('logstream created')).catch(e => console.error(e))
let sequenceToken = null
export const send = async(message) => {
  try {
    await _createLogStream
    const command = new PutLogEventsCommand({
      sequenceToken,
      logStreamName,
      logGroupName: '/mobile/manager',
      logEvents: [{
        timestamp: new Date().getTime(),
        message }]
    })
    const result = await client.send(command)
    sequenceToken = result.nextSequenceToken
  } catch (error) {
    console.error(error)
  }
}
