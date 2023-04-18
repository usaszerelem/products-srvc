const dynamoose = require('dynamoose');
//const nanoid = require('nanoid');
const short = require('short-uuid');
const Joi = require('joi');

const PRODUCTID_LENGTH = 22;
const CODE_MIN_LENGTH = 8;
const CODE_MAX_LENGTH = 12;
const MATERIALID_MIN_LENGTH = 3;
const MATERIALID_MAX_LENGTH = 5;
const DESCRIPTION_MIN_LENGTH = 6;
const DESCRIPTION_MAX_LENGTH = 60;
const CATEGORY_MIN_LENGTH = 3;
const CATEGORY_MAX_LENGTH = 30;
const MANUFACTURER_MIN_LENGTH = 5;
const MANUFACTURER_MAX_LENGTH = 30;

// https://github.com/dynamoose/dynamoose/issues/57

// ~139 years needed, in order to have a 1% probability of at least one collision.
// console.log(nanoid(11)) //=> "bdkjNOkq9PO"

const productSchema = new dynamoose.Schema({
    productId: {
        type: String,
        hashKey: true,
        required: true,
        default: short.generate()
    },
    sku: {
        type: String,
        required: true
    },
    code: {
        type: String,
        required: true
    },
    unitOfMeasure: {
        type: String,
        required: true
    },
    materialID: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    manufacturer: {
        type: String,
        required: true
    },
    consumerUnits: {
        type: Number,
        required: true
    },
    multiPackDiscount: {
        type: Boolean,
        required: true
    },
    isMultiCop: {
        type: Boolean,
        required: true
    },
    isMultiSkoal: {
        type: Boolean,
        required: true
    },
    isMultiRedSeal: {
        type: Boolean,
        required: true
    },
    pullPMUSA: {
        type: Boolean,
        required: true
    },
    pullPMUSAAll: {
        type: Boolean,
        required: true
    },
    pullUSSTC: {
        type: Boolean,
        required: true
    },
    multiCanDiscount: {
        type: Boolean,
        required: true
    },
    isValidUPC: {
        type: Boolean,
        required: true
    },
});

// ---------------------------------------------------------------------------

function validateProduct(product) {
    const schema = Joi.object({
        productId: Joi.string().min(PRODUCTID_LENGTH).max(PRODUCTID_LENGTH),
        sku: Joi.string().min(CODE_MIN_LENGTH).max(CODE_MAX_LENGTH).required(),
        code: Joi.string().min(CODE_MIN_LENGTH).max(CODE_MAX_LENGTH).required(),
        unitOfMeasure: Joi.string().valid('PACK','CARTON', 'ROLL', 'CAN', 'EACH'),
        materialID: Joi.string().min(MATERIALID_MIN_LENGTH).max(MATERIALID_MAX_LENGTH).required(),
        description: Joi.string().min(DESCRIPTION_MIN_LENGTH).max(DESCRIPTION_MAX_LENGTH).required(),
        category: Joi.string().min(CATEGORY_MIN_LENGTH).max(CATEGORY_MAX_LENGTH).required(),
        manufacturer: Joi.string().min(MANUFACTURER_MIN_LENGTH).max(MANUFACTURER_MAX_LENGTH).required(),
        consumerUnits: Joi.number().positive(),
        multiPackDiscount: Joi.boolean(),
        isMultiCop: Joi.boolean(),
        isMultiSkoal: Joi.boolean(),
        isMultiRedSeal: Joi.boolean(),
        pullPMUSA: Joi.boolean(),
        pullPMUSAAll: Joi.boolean(),
        pullUSSTC: Joi.boolean(),
        multiCanDiscount: Joi.boolean(),
        isValidUPC: Joi.boolean()
    }).options({allowUnknown: false});

    return schema.validate(product);
}

// ---------------------------------------------------------------------------

const Product = dynamoose.model("products", productSchema);

module.exports.Product = Product;
module.exports.validateProduct = validateProduct;
