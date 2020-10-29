const { program } = require('commander');
const zlib = require('zlib');
const { promisify } = require('util');
const AWS = require('aws-sdk');
const { chunk } = require('lodash');

const gunzip = promisify(zlib.gunzip);

program
  .requiredOption('--bucket <bucket>', 'Bucket with events')
  .requiredOption('--stream <stream>', 'Kinesis stream')
  .option('--prefix <prefix>', 'Events prefix (i.e. 2020/10)')
  .option('--region <region>', 'AWS region', 'eu-west-1')
  .option('--parallel <max>', 'Parallel requests', 20)
  .parse(process.argv);

AWS.config.update({ region: program.region });

const S3 = new AWS.S3();
const kinesis = new AWS.Kinesis();

async function getKeys(bucketName, prefix) {
  let loadMore = true;
  let keys = [];
  const params = {
    Bucket: bucketName,
    Prefix: prefix,
  };

  while (loadMore) {
    const objects = await S3.listObjectsV2(params).promise();
    objects.Contents.forEach((content) => keys.push(content.Key));
    loadMore = objects.IsTruncated;
    params.ContinuationToken = objects.NextContinuationToken;
  }

  return keys;
}

async function readEvents(bucketName, key) {
  const object = await S3.getObject({
    Bucket: bucketName,
    Key: key,
  }).promise();

  const unzipped = await gunzip(object.Body);
  return unzipped.toString().replace(/}{/g, '}\n{').split('\n');
}

function sendEvents(events, streamName) {
  const PartitionKey = '1';
  // We can't have more than 500 records per call
  const chunks = chunk(events, 500);
  return Promise.all(
    chunks.map((chunk) =>
      kinesis
        .putRecords({
          Records: chunk.map((event) => {
            return { Data: event, PartitionKey };
          }),
          StreamName: streamName,
        })
        .promise(),
    ),
  );
}

async function replay(bucketName, prefix, streamName, parallelRequests) {
  console.log('fetching keys');
  const keys = await getKeys(bucketName, prefix);
  const batches = chunk(keys, parallelRequests);
  let batchNumber = 0;
  for (let batch of batches) {
    batchNumber += 1;
    console.log(`batch ${batchNumber} of ${batches.length}`);
    await Promise.all(
      batch.map((key) => {
        console.log('replaying', key);
        return readEvents(bucketName, key).then((events) => sendEvents(events, streamName));
      }),
    );
  }
}

replay(program.bucket, program.prefix, program.stream, program.parallel);
