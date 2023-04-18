const dynamoose = require('dynamoose');
//const nanoid = require('nanoid');
const short = require('short-uuid');
const Joi = require('joi');
const jwt = require('jsonwebtoken');
require('../utils/constants');

// ----------------------------------------------------------------
// Field min/max length

const USERID_LENGTH = 22;
const FNAME_MIN_LENGTH = 2;
const FNAME_MAX_LENGTH = 20;
const LNAME_MIN_LENGTH = 5;
const LNAME_MAX_LENGTH = 20;
const EMAIL_MIN_LENGTH = 5;
const EMAIL_MAX_LENGTH = 255;
const PASSWORD_MIN_LENGTH = 5;
const PASSWORD_MAX_LENGTH = 1024;

// ----------------------------------------------------------------

const userSchema = new dynamoose.Schema({
    userId: {
        type: String,
        hashKey: true,
        required: true,
        default: short.generate()
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    operations: {
        type: Array,
        schema: [{type: String}]
    }
});

// ---------------------------------------------------------------------------
// Store the user's ID and Boolean flag indicating whether the user is an admim
// in the JWT. Based on this simple role based authorization can be made.
// ---------------------------------------------------------------------------

function generateAuthToken(user) {
    const token = jwt.sign(
        { userId: user.userId, operations: user.operations},
        process.env.JWT_PRIVATE_KEY,
        {expiresIn: process.env.JWT_EXPIRATION}
        );

    return (token);
}

// ---------------------------------------------------------------------------
// Validation of the user object.
// ---------------------------------------------------------------------------

function validateUser(user) {

    const schema = Joi.object({
        userId: Joi.string().min(USERID_LENGTH).max(USERID_LENGTH),
        firstName: Joi.string().min(FNAME_MIN_LENGTH).max(FNAME_MAX_LENGTH).required(),
        lastName: Joi.string().min(LNAME_MIN_LENGTH).max(LNAME_MAX_LENGTH).required(),
        email: Joi.string().min(EMAIL_MIN_LENGTH).max(EMAIL_MAX_LENGTH).required().email(),
        password: Joi.string().min(PASSWORD_MIN_LENGTH).max(PASSWORD_MAX_LENGTH).required(),
        operations: Joi.array().items(Joi.string())
    }).options({allowUnknown: false});

    return schema.validate(user);
}

// ---------------------------------------------------------------------------

const User = dynamoose.model("users", userSchema);

module.exports.User = User;
module.exports.validateUser = validateUser;
module.exports.generateAuthToken = generateAuthToken;
