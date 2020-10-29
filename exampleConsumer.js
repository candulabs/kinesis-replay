const AWS = require('aws-sdk');

AWS.config.update({ region: 'eu-west-1' });

const kinesis = new AWS.Kinesis();

async function consumer() {
  const streamData = await kinesis
    .describeStream({
      StreamName: 'StepanTest',
    })
    .promise();

  const iterators = await Promise.all(
    streamData.StreamDescription.Shards.map(({ ShardId }) =>
      kinesis
        .getShardIterator({
          ShardId,
          ShardIteratorType: 'TRIM_HORIZON',
          StreamName: 'StepanTest',
        })
        .promise()
        .then((result) => result.ShardIterator),
    ),
  );

  while (iterators.length) {
    let i = iterators.shift();
    const records = await kinesis.getRecords({ ShardIterator: i }).promise();
    iterators.push(records.NextShardIterator);
    if (records.Records.length) {
      records.Records.forEach((record) => console.log(record.Data.toString()));
    } else {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
}

consumer().catch(console.error);
