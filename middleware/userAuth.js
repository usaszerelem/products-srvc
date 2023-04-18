const AppLogger = require('../utils/logger.js');
const logger = new AppLogger(module);
const jwt = require('jsonwebtoken');

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------

function userAuth(req, res, next) {
    const token = req.header('x-auth-token');

    if (!token) {
        const msg = 'Access denied. No token provided.';
        logger.error(msg);
        return res.status(401).send(msg);
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_PRIVATE_KEY);
        req.user = decoded;
        next();
    } catch(ex) {
        const msg = 'Invalid token.';
        logger.error(msg);
        res.status(400).send(msg);
    }
}

module.exports = userAuth;
