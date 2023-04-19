# products-srvc
AWS DynamoDB and dynamoose CRUD operation service

## Environment variables that must be set:
- PORT - Service port to use
- LOG_LEVEL - set to "debug" as an example
- CONSOLELOG_ENABLED - set to 1 to enable logging to the console
- JWT_PRIVATE_KEY - Private key to use for creating tokens
- JWT_EXPIRATION - Token TTL value. https://github.com/auth0/node-jsonwebtoken#readme
- AWS_REGION - Set to "us-east-2" or whatever your region is
- AWS_ACCESS_KEY_ID - AWS access key ID to use
- AWS_SECRET_ACCESS_KEY - Corresponding secret access key
