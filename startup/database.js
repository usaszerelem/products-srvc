const dynamoose = require('dynamoose');

module.exports = async function() {

    const client = new dynamoose.aws.ddb.DynamoDB({
        "accessKeyId":      process.env.AWS_ACCESS_KEY_ID,
        "secretAccessKey":  process.env.AWS_SECRET_ACCESS_KEY,
        "region":           process.env.AWS_REGION
        });

    // Set DynamoDB instance to the Dynamoose DDB instance
    dynamoose.aws.ddb.set(client);
}
