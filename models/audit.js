const dynamoose = require('dynamoose');
const short = require('short-uuid');
const Joi = require('joi');
const constants = require('../utils/constants');

const auditSchema = new dynamoose.Schema({
    auditId: {
        type: String,
        hashKey: true,
        required: true,
        default: short.generate()
    },
    timeStamp: {
        type: String,
        required: true
    },
    userId: {
        type: String,
        required: true
    },
    operation: {
        type: String,
        required: true
    },
    method: {
        type: String,
        required: true
    },
    data: {
        type: String,
        required: true
    }
});

// ---------------------------------------------------------------------------
// Validation of the user object.
// ---------------------------------------------------------------------------

function validateAudit(audit) {

    const schema = Joi.object({
        auditId: Joi.string().min(constants.ID_LENGTH).max(constants.ID_LENGTH),
        timeStamp: Joi.string().min(constants.TIMESTAMP_LENGTH).max(constants.TIMESTAMP_LENGTH).required(),
        userId: Joi.string().min(constants.ID_LENGTH).max(constants.ID_LENGTH).required(),
        operation: Joi.string().min(constants.AUDIT_OPERATION_LENGTH_MIN).max(constants.AUDIT_OPERATION_LENGTH_MAX).required(),
        method: Joi.string().min(constants.METHOD_LENGTH_MIN).max(constants.METHOD_LENGTH_MAX).required(),
        data: Joi.string().min(0).max(constants.AUDIT_DATA_MAX_LENGTH)
    }).options({allowUnknown: false});

    return schema.validate(audit);
}

const Audit = dynamoose.model("audit", auditSchema);

module.exports.Audit = Audit;
module.exports.validateAudit = validateAudit;
