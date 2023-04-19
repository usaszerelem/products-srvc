const AppLogger = require('../utils/logger.js');
const logger = new AppLogger(module);
const _ = require('underscore');
const constants = require('../utils/constants.js');

// ---------------------------------------------------------------------------
// Middleware authorization function that requires the user to have access to
// user upsert operation permission
// ---------------------------------------------------------------------------

async function userCanUpsert(req, res, next) {

    try {
        if ( _.isUndefined(req.user.operations) === false &&
            !req.user.operations.includes(constants.OP_USER_UPSERT)) {
            const msg = 'Forbidden upserting users';
            logger.error(msg);
            return res.status(403).send(msg);
        }

        next();
    } catch(ex) {
        logger.error(ex);
        return res.status(500).send(ex);
    }
}

module.exports = userCanUpsert;