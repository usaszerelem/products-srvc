const helmet = require('helmet');
const compression = require('compression');
const AppLogger = require('../utils/logger.js');
const logger = new AppLogger(module);

module.exports = async function(app) {
    app.use(helmet());
    app.use(compression());

    const envVars = [
        "PORT",
        "JWT_PRIVATE_KEY",
        "JWT_EXPIRATION",
        "AWS_ACCESS_KEY_ID",
        "AWS_SECRET_ACCESS_KEY"
    ];

    envVars.forEach(element => {
        if (process.env[element] === undefined) {
            const msg = "Environment variable " + element + " must be set.";
            logger.error(msg);
            throw msg;
        }
    });
}
