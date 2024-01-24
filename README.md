# PRODUCTS-SRVC

This is a sample and generic service to manage product informations and users that have access to product information.

## Product Information

This generic service is based manages candy bars, but it can be very easily and with minimal changes be updated to manage any other product and any number or properties.
The file to update for this service to manage any other product is the ./src/models/product.ts file

## User Information

Products and users can only be called by authenticated users. Only a user with 'UserUpsert' privileges can add/update users. Once a user is added, the user needs to authenticate and provide the JSON Web Token in the x-auth-token header field.

# Installation Dependecies

This service uses MongoDB and you need either an onpresite of cloud based MongoDB access. Also optionally and audit service can be made as a dependency. If an audit service is configured, all RESTful calls and responses are saved offline to a separate audit service, including information about the user that performed the action.

To start mongodb/brew/mongodb-community now and restart at login:
brew services start mongodb/brew/mongodb-community

Or, if you don't want/need a background service you can just run:
mongod --config /usr/local/etc/mongod.conf

## Configuration

All default configurations are loaded from environment variables. These must be present of the service will fail to load with a specific error message indicating which environment variables are missing.

## Environment Variables

All configuration settings are specified using environment variables. List of mandatory environment variables are:

-   NODE_ENV=development | production
-   USE_HTTPS=false - Boolean true/false on whether HTTPS should be used when listening
-   LOG_LEVEL=debug - Minimum log level to log. Possible values are 'debug', 'info', 'warn' and 'error'.
-   CONSOLELOG_ENABLED=true - Boolean value that indicates whether to enable logging on the console
-   FILELOG_ENABLED=false - Boolean value that indicates whether to enable logging to circular file
-   MONGOLOG_ENABLED=false - Boolean value that indicates whether to enable logging to Mongo DB
-   SERVICE_NAME='products-srvc service' - Name of the service that should be used in log initialization
-   PORT=3000 - Port number that the service should listen on
-   MONGODB_URL='mongodb://localhost:27017/productmanager' - URL for Mongo DB connection
-   AUDIT_ENABLED=false - Boolean value to indicate whether to make audit service a dependent downlevel service
-   AUDIT_API_KEY=1234abcd - API Key that the audit service is expecting
-   AUDIT_URL='https://localhost:3001/api/audit' - URL for downlevel audit service
-   JWT_PRIVATE_KEY=privatekey - Private key that should be used for encryption.
-   JWT_EXPIRATION=365d - Time To Live (TTL) value for the token. Read: https://www.npmjs.com/package/jsonwebtoken
-   NODE_TLS_REJECT_UNAUTHORIZED=0 - development only

# Priming the Database

To prime MongoDB with an initial super user and a list of candy bar products for testing, two scripts were provided that can be invoked using the NPM command. From the 'package.json' file:

```
"scripts": {
    "user": "ts-node ./src/scripts/createSuperUser.ts",
    "products": "ts-node ./src/scripts/createProducts.ts",
}
```

-   'npm start user' - Primes a 'Super Duper' user into the database with the encrypted password 'abcdefg'. You should of course change this as you change your private key and regenerate the user's encrypted password field.
-   'npm start products' - Primes a list of candy bars into the product database that you can use to start calling the various RESTful methods.

# Deploying Service to AWS

-   Create an AWS account
-   Find the EC2 instance area
-   Click 'Launch Instance' orange button.
-   Type name for the instance. As an example: products-srvc
-   Select Ubuntu OS image. This should be a free tier, which is fine for occasional use.
-   Under 'Key pair(login)' type a name for the key pair certificate file. Example: product-srvc-ec2. Click on 'Create new key pair'
-   Select the key pair type to be 'RSA' and private key file format .pem. Click 'Create key pair'
-   Save the certificate file in a dedicated certificates directory where you can find it.
-   Open a bash shell and navigate to the certificate directory that you just created.
-   Change access rights to the pem file: sudo chmod 400 product-srvc-ec2
-   Under 'Network settings' leave everything as-is. Only checkbox to be checked is 'Allow SSH traffic from' Anywhere.
-   Same with storage. Defalt balue of 8GiB is fine
-   Click 'Launch Instance'. Once launched click on the instance gibberish ID number.
-   Once the instance state is 'Running' SSH connection is possible.

## Configuring EC2 instance

-   Click on the checkbox at the beginning of the instance followed by clicking on the 'Connect' button.
-   In the 'SSH client' tab, you can see the example SSH connection string to the instance.
-   In your terminal shell, navigate to the directory where your pem file is located.
-   Copy/Paste this connection string into your terminal shell.
-   Now we need to install node, npm and all dependency packages

### Install 'curl'

This is needed to bring down node packages

-   Type: sudo apt-get install curl

### Install 'node'

-   Type: curl -sL https://deb.nodesource.com/setup_16.x | sudo -E bash -
-   Run `sudo apt-get install -y nodejs` to install Node.js 16.x and npm
-   This installed the LTS version 16 of node. We are going to update to the latest
-   Update npm: sudo npm install -g n
-   Update node: sudo n latest
-   Exit SSH and re-enter. Type: "node -v" and you should see a newer version like v20.5.0

### Install other dependencies

-   Install PM2, which is a utility that ensures node keeps running even after SSH shell is terminated
-   Type: **sudo npm install pm2@latest -g**
-   Later you run it like this: **pm2 start directory/index.js**
-   Install 'copyfiles' that is needed for post build file copying: sudo npm install copyfiles -g

### Get code from GitHub

-   Get the HTTPS/SHH link from the GitHub project. Copy it to the clipboard.
-   In the shell type: **sudo git clone 'link from GitHub'**
-   Now the repo should be within the EC2 instance

### Configure environment variables

Update the environment variables by:

-   Change directory into the downloade code directory: 'products-srvc'.
-   Get all the project dependencies: **npm i**
-   Open the **setenv.sh** file with the editor (vi) and modify it per production environment.
-   Load the environment variables from this file: **source ./setenv.sh**

### Security configuration

-   On the AWS instance summary page, you will see the 'Public IPv4 address' for the instance.
-   Log in to MongoDB Atlas and on the 'Network Access' page, add this IP address to the access list.
-   On the AWS instance summary page, click on the 'Security' tab.
-   You should see that under the 'Inbound rules' the only port that is open is 22. We need to add our server port.
-   Click on the security group hyperlink followed by the 'Edit inbound rules' button.
-   Add the following inbound rule:
    -   Type: Custom TCP
    -   Port range: 3000
    -   Source: Anywhere IPv4
    -   Description: products-srvc
    -   Click 'Save rules'
-   Validate that the server is running and accessible externally by copy/pasting the public IP and port number into an Internet Browser. There should be a condfirmation message saying that the service is running.

### Running Unit/Integration tests

All tests should be conducted on a test database so that any data can be modified, deleted safely without compromising the real product database. It is very easy to specify what datbase should be used by updating the MONGODB_URL environment variable before the tests are run. Example:

**MONGODB_URL=mongodb://localhost:27017/products_test**

To run the actual tests, you of course ensure that all files build correctly and from the command line where yo have all the environment variables set up, you type: **npm run test**

It could be helpful to only run certain test while developing or creating new tests. This can easily be accomplished by specifying the TypeScript file that contains the tests of interest. As an example if all user management related tests are requested to be run, append to the previously mentioned command line the name of the test file. Like this: **npm run test user.test.ts**

### Running the service

-   Build the typescript project: **npm run build**
-   Launch it using pm2: **pm2 start dist/src/index.js**

# Helpful links

The following links were referenced for local and EC2 instance installation and configuration:

-   How to deploy Node Express to AWS EC2: https://www.youtube.com/watch?v=T-Pum2TraX4
-   Configure JEST: https://itnext.io/testing-with-jest-in-typescript-cc1cd0095421
-   MongoDB Installation: https://docs.mongodb.com/manual/tutorial/install-mongodb-on-os-x/

# Pending enhancements

If a user's credentials are revoked, the issued token remains valid until the token's TTL value is reached. This is not desirable so I will add a redis cache that will contain revoked user tokens.
