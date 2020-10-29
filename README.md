# kinesis-replay

replay kinesis events from S3

run `yarn` to install dependencies then `node ./replay.js --help` for usage

For example:

```
node ./replay.js --bucket candu-events --stream ReplayStaging2 --prefix 2020/10/2
```

Will fetch all events that happened in 20-29 of October and send them to ReplayStaging2 stream.
