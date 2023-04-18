const AppLogger = require('../utils/logger.js');
const logger = new AppLogger(module);
const _ = require('underscore');
const constants = require('../utils/constants.js');

// ---------------------------------------------------------------------------
// Middleware authorization function that requires the user to have access to
// user list operation permission
// ---------------------------------------------------------------------------

async function userCanList(req, res, next) {
    try {
        if ( _.isUndefined(req.user.operations) === false &&
            !req.user.operations.includes(constants.USER_LIST)) {
            const msg = 'Forbidden reading users';
            logger.error(msg);
            return res.status(403).send(msg);
        }

        next();
    } catch(ex) {
        logger.error(ex);
        return res.status(500).send(ex);
    }
}

module.exports = userCanList;