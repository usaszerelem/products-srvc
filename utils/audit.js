const dynamoose = require('dynamoose');
const { Audit, validateAudit } = require('../models/audit.js');
const AppLogger = require('../utils/logger.js');
const logger = new AppLogger(module);
const constant = require('./constants.js');
const short = require('short-uuid');

// ----------------------------------------------------------
// ----------------------------------------------------------

async function create(userId, operation, method, data) {
    try {
        var date = new Date();
        
        if (data.length > constant.AUDIT_DATA_MAX_LENGTH) {
            data = data.substring(0, constant.AUDIT_DATA_MAX_LENGTH-1);
        }

        let audit = new Audit({
            auditId: short.generate(),
            timeStamp: date.toISOString(), //"2011-12-19T15:28:46.493Z"
            userId: userId,
            operation: operation,
            method: method,
            data: data
        });

        const { error } = validateAudit(audit);

        if (error) {
            logger.error('Audit information failed validation');
            return res.status(400).send(error.details[0].message);
        }

        await audit.save();
        logger.info(`Audit info added for user ${userId}, ${operation}`);
    } catch(ex){
        logger.error(ex);
    }
}

module.exports.create = create;
