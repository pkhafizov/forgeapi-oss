'use strict';

const { BucketsApi, ObjectsApi, PostBucketsPayload } = require('forge-apis');
const { getClient, getInternalToken, getClientId } = require('forgeapi-auth');

async function getBuckets(oauth_token, oauth_client, bucket_name) {
  let responseBody = '';
  let responseError = {
    statusCode: 500,
    body: 'error getBuckets'
  };
  try {
    var client_id = await getClientId();
  } catch (error) {
    return error;
  }

  if (!bucket_name || bucket_name === '#') {
    try {
      // Retrieve buckets from Forge using the [BucketsApi](https://github.com/Autodesk-Forge/forge-api-nodejs-client/blob/master/docs/BucketsApi.md#getBuckets)
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
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        body: responseBody
      };
    } catch (err) {
      return err;
    }
  } else {
    try {
      // Retrieve objects from Forge using the [ObjectsApi](https://github.com/Autodesk-Forge/forge-api-nodejs-client/blob/master/docs/ObjectsApi.md#getObjects)
      const objects = await new ObjectsApi().getObjects(bucket_name, {}, oauth_client, oauth_token);
      responseBody = objects.body.items.map((object) => {
        return {
          id: Buffer.from(object.objectId).toString('base64'),
          text: object.objectKey,
          type: 'object',
          children: false
        };
      });
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        body: responseBody
      };
    } catch (err) {
      return err;
    }
  }
}

async function postObjects() {
  fs.readFile(req.file.path, async (err, data) => {
    if (err) {
      next(err);
    }
    try {
      // Upload an object to bucket using [ObjectsApi](https://github.com/Autodesk-Forge/forge-api-nodejs-client/blob/master/docs/ObjectsApi.md#uploadObject).
      await new ObjectsApi().uploadObject(
        req.body.bucketKey,
        req.file.originalname,
        data.length,
        data,
        {},
        req.oauth_client,
        req.oauth_token
      );
      res.status(200).end();
    } catch (err) {
      next(err);
    }
  });
}
