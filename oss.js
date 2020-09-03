'use strict';

const AWS = require('aws-sdk');
const { BucketsApi, ObjectsApi } = require('forge-apis');
const { getClientId } = require('forgeapi-auth');

const s3 = new AWS.S3();
const ssm = new AWS.SSM();

async function getBuckets(oauth_token, oauth_client, bucket_name) {
  let responseBody = '';
  var client_id = await getClientId();
  if (!bucket_name || bucket_name === '#') {
    const buckets = await new BucketsApi().getBuckets({ limit: 64 }, oauth_client, oauth_token);
    responseBody = buckets.body.items.map((bucket) => {
      return {
        id: bucket.bucketKey,
        // Remove bucket key prefix that was added during bucket creation
        text: bucket.bucketKey.replace(client_id.toLowerCase() + '-', ''),
        type: 'bucket',
        children: true
      };
    });
    return responseBody;
  } else {
    const objects = await new ObjectsApi().getObjects(bucket_name, {}, oauth_client, oauth_token);
    responseBody = objects.body.items.map((object) => {
      return {
        id: Buffer.from(object.objectId).toString('base64'),
        text: object.objectKey,
        type: 'object',
        children: false
      };
    });
    return responseBody;
  }
}

async function postObjects(oauth_token, oauth_client, bucketKey, fileName) {
  const paramBucketName = process.env.BUCKET_NAME;
  let bucketNameParam = {
    Name: paramBucketName
  };
  const bucketName = await ssm.getParameter(bucketNameParam).promise();
  const paramsObject = {
    Bucket: bucketName.Parameter.Value,
    Key: fileName
  };
  var originObject = await s3.getObject(paramsObject).promise();
  try {
    await new ObjectsApi().uploadObject(
      bucketKey,
      fileName,
      originObject.ContentLength,
      originObject.Body,
      {},
      oauth_client,
      oauth_token
    );
  } catch (e) {
    console.log(e);
  }

  return 'Ok';
}

module.exports = {
  getBuckets,
  postObjects
};
