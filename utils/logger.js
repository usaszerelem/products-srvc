'use strict';
const winston = require('winston');
const path = require('path');
require('winston-daily-rotate-file');
const { combine, cli, timestamp, printf, colorize, align, json, errors} = winston.format;

module.exports = class AppLogger {
   constructor(callingModule) {
        var parts = callingModule.filename.split('/');
        this.location = parts[parts.length - 2] + '/' + parts.pop();
        this.meta = "";
        this.fileLoggerName = undefined;
        this.consoleLoggerName = undefined;
        this.fileLogger = undefined;
        this.consoleLogger = undefined;

        this.configFileLogger(callingModule);
        this.configConsoleLogger(callingModule);
    }

    error(message, jSonMetaData = undefined) {
        if (this.fileLogger !== undefined) {
            this.fileLogger.error(message, this.getLogFileDefault(jSonMetaData));
        }

        if (this.consoleLogger !== undefined) {
            this.consoleLogger.error(message);
        }
    }

    warn(message, jSonMetaData = undefined) {
        if (this.fileLogger !== undefined) {
            this.fileLogger.warn(message, this.getLogFileDefault(jSonMetaData));
        }

        if (this.consoleLogger !== undefined) {
            this.consoleLogger.warn(message);
        }
    }

    info(message, jSonMetaData = undefined) {
        if (this.fileLogger !== undefined) {
            this.fileLogger.info(message, this.getLogFileDefault(jSonMetaData));
        }

        if (this.consoleLogger !== undefined) {
            this.consoleLogger.info(message);
        }
    }

    debug(message, jSonMetaData = undefined) {
        if (this.fileLogger !== undefined) {
            this.fileLogger.debug(message, this.getLogFileDefault(jSonMetaData));
        }

        if (this.consoleLogger !== undefined) {
            this.consoleLogger.debug(message);
        }
    }

    getLogFileDefault(jSonMetaData) {
        let logFileDefault = {
            "location": this.location
        };

        this.meta = "";

        if (jSonMetaData !== undefined && this.isJSON(jSonMetaData) === true) {
            logFileDefault = Object.assign({}, jSonMetaData, logFileDefault);
            this.meta = JSON.stringify(jSonMetaData);
        }

        return logFileDefault;
    }

    configFileLogger(callingModule) {
        /**
         * If file logging is enabled via the FILELOG_ENABLED environment variable and
         * jest is not running, then initialize file logger. If jest is running then
         * we disable logging as logging causes difficult to comprehend jest output.
         */

        this.fileLoggerName = "fileLogger-";
    
        this.fileLoggerName += callingModule.filename.slice(
            callingModule.filename.lastIndexOf(path.sep)+1,
            callingModule.filename.length -3
            );

        if (process.env.FILELOG_ENABLED && typeof jest === 'undefined') {
            const fileRotateTransport = new winston.transports.DailyRotateFile({
                filename: 'AppLog-%DATE%.log',
                datePattern: 'YYYY-MM-DD',
                maxFiles: '4d'
            });
    
            winston.loggers.add(this.fileLoggerName, {
                level: process.env.LOG_LEVEL || 'info',
                format: combine(timestamp(),json()),
                transports: [fileRotateTransport]
            });
    
            this.fileLogger = winston.loggers.get(this.fileLoggerName);
        }
    }
    
    configConsoleLogger(callingModule) {
        /**
         * If file logging is enabled via the FILELOG_ENABLED environment variable and
         * jest is not running, then initialize file logger. If jest is running then
         * we disable logging as logging causes difficult to comprehend jest output.
         */

        this.consoleLoggerName = "consoleLogger-";
    
        this.consoleLoggerName += callingModule.filename.slice(
            callingModule.filename.lastIndexOf(path.sep)+1,
            callingModule.filename.length -3
            );
    
        if (process.env.CONSOLELOG_ENABLED && typeof jest === 'undefined') {
            winston.loggers.add(this.consoleLoggerName, {
                level: process.env.LOG_LEVEL || 'info',
                format: combine(
                    colorize({ all: true }),
                    timestamp(),
                    printf((info) => `[${info.timestamp}] ${info.level}: ${this.location}, ${info.message} ${this.meta}`)
                    ),
    
                transports: [new winston.transports.Console()],
            });
    
            this.consoleLogger = winston.loggers.get(this.consoleLoggerName);
        }
    }

    /**
     * Returns a Boolean true if the passed data is a JSON object
     *
     * @param {string,object} data - data to check
     * @returns {boolean} - true if JSON object, false otherwise
     */

    isJSON(jSonObj) {
        var ret = true;
        try {
            JSON.parse(JSON.stringify(jSonObj));
        }catch(e) {
            ret = false;
        }
        return ret;
    }
}
