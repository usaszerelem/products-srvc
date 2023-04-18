const express = require('express');
const AppLogger = require('./utils/logger.js');
const logger = new AppLogger(module);
const app = express();

logger.info('Loading: ./startup/prod');
require('./startup/prod')(app);
logger.info('Loading: ./startup/database');
require('./startup/database')(app);
logger.info('Loading: ./startup/routes');
require('./startup/routes')(app);

const port = process.env.PORT;

const server = app.listen(port, () => {
    var host = server.address().address;

    if (host === '::') {
        host = 'localhost'
    }
    var port = server.address().port;
    logger.info(`Listening at http://${host}:${port}`);
});

module.exports = server;
