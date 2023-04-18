const express = require('express');
const router = express.Router();
const { User, validateUser } = require('../models/users.js');
const AppLogger = require('../utils/logger.js');
const logger = new AppLogger(module);
const _ = require('underscore');
const short = require('short-uuid');
const {hashPassword} = require('../utils/hash.js');
const userAuth = require('../middleware/userAuth');
const userCanUpsert = require('../middleware/userCanUpsert.js');
const userCanList = require('../middleware/userCanList.js');

// ---------------------------------------------------------------------------
// Create (register) a new user. This is a functionality exposed only to
// administrators. Therefore the caller must be authenticated and authorized
// to make this call.
// ---------------------------------------------------------------------------

router.post('/', [userAuth, userCanUpsert], async (req,res) => {
    try {
        logger.info('Registering a new user...');

        const { error } = validateUser(req.body);

        if (error) {
            logger.error('User information failed validation');
            return res.status(400).send(error.details[0].message);
        } else if (await findUserByEmail(req.body.email) !== undefined) {
            // Only one user with the same email can exist.
            // Unfortunatelly dynamoose dose note have the
            // 'unique' schema attribute like mongoose so this
            // manual check must be done.
            const msg  = `User already registered: ${req.query.email}`;
            logger.error(msg);
            return res.status(400).send(msg);
        }

        let password = await hashPassword(req.body.password);
        let user = new User(_.omit(req.body, 'password'));

        user.password = password;
        user.userId = short.generate();

        await user.save();

        logger.info("User was added. UserID: " + user.userId);
        logger.debug(JSON.stringify(user));

        return res.status(200).json(_.omit(user, 'password'));
    } catch(ex) {
        logger.error(ex);
        return res.status(500).send(ex);
    }
});

// ----------------------------------------------------------
// retrieve information of the currently logged in user and
// this information comes from the logged in user's JWT.
// ----------------------------------------------------------

router.get('/me', userAuth, async (req,res) => {
    try {
        const user  = await User.get(req.user.userId);

        if (_.isUndefined(user) === true) {
            const errMsg = `User with ID ${req.user.userId} was not found`;
            console.warn(errMsg);
            return res.status(400).send(errMsg);
        }

        return res.status(200).json(_.omit(user, 'password'));
    } catch(ex) {
        logger.error(ex);
        return res.status(500).send(ex);
    }
});

// ----------------------------------------------------------
// Only authenticated users with user list permission are
// allowed to access this functionality.
// ----------------------------------------------------------

router.get('/', [userAuth, userCanList], async (req,res) => {
    try {
        let errMsg = undefined;
        let user = undefined;

        if (_.isUndefined(req.query.email) === false) {
            user = await findUserByEmail(req.query.email);

            if (_.isUndefined(user) === true) {
                errMsg = `User with email ${req.query.email} was not found`;
            }
        } else if (_.isUndefined(req.query.userId) === false) {
            user  = await User.get(req.query.userId);

            if (_.isUndefined(user) === true) {
                errMsg = `User with ID ${req.query.userId} was not found`;
            }
        }

        if (_.isUndefined(user) === true) {
            console.warn(errMsg);
            return res.status(400).send(errMsg);
        }

        logger.info("User found: " + user.userId);
        logger.debug(JSON.stringify(user));

        return res.status(200).json(_.omit(user, 'password'));
    } catch (ex) {
        logger.error(ex);
        return res.status(500).send(ex);
    }
});

// ----------------------------------------------------------
// ----------------------------------------------------------

async function findUserByEmail(email) {
    let user = undefined;

    try {
        user = await User.scan({email: {contains: email}}).all().exec();
        if (user.count == 0){
            user = undefined;
        } else if (user.count > 1) {
            throw "Internal error in findUserByEmail()"
        }
        else {
            user = user[0];
        }
    } catch(ex) {
        logger.debug(ex);
        return res.status(500).send(ex);
    }

    return(user);
}

module.exports = router;
module.exports.findUserByEmail = findUserByEmail;
