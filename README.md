# kinesis-replay 🔁

Replay kinesis events from S3.

```
$ npm install -g kinesis-replay
# or
$ yarn global add kinesis-replay
$ kinesis-replay --help
Usage: kinesis-replay [options]

Options:
  --bucket <bucket>  Bucket with events
  --stream <stream>  Kinesis stream
  --prefix <prefix>  Events prefix (i.e. 2020/10)
  --region <region>  AWS region (default: "eu-west-1")
  --parallel <max>   Parallel requests (default: 20)
  -h, --help         display help for command
```

Example:

```
node ./replay.js --bucket <s3-bucket> --stream <kinesis-stream> --prefix 2020/10/2
```

Will fetch all events that happened in 20-29 of October and send them to ReplayStaging2 stream.
