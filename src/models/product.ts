const mongoose = require('mongoose');
const Joi = require('joi-oid');

export namespace Limits {
    export const SKU_MIN_LENGTH = 3;
    export const SKU_MAX_LENGTH = 20;
    export const NAME_MIN_LENGTH = 6;
    export const NAME_MAX_LENGTH = 60;
    export const DESC_MIN_LENGTH = 0;
    export const DESC_MAX_LENGTH = 600;
}

const attribSchema = new mongoose.Schema(
    {
        key: String,
        value: String,
    },
    { _id: false }
);

const productSchema = new mongoose.Schema(
    {
        /*
        - If you have declared _id field explicitly in schema, you must initialize it explicitly
        - If you have not declared it in schema, MongoDB will declare and initialize it.

        _id: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
        }, */
        isActive: {
            type: Boolean,
            required: true,
        },
        sku: {
            type: String,
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        stockQuantity: {
            type: Number,
            required: true,
        },
        purchasePrice: {
            type: Number,
            required: true,
        },
        salePrice: {
            type: Number,
            required: true,
        },
        categories: {
            type: Array,
            required: true,
        },
        images: {
            type: Array,
            required: true,
        },
        attributes: [attribSchema],
    },
    { timestamps: true, versionKey: false }
);

export const Product = mongoose.model('products', productSchema);

// ---------------------------------------------------------------------------

export function validateProduct(product: typeof Product) {
    const schema = Joi.object({
        isActive: Joi.boolean(),
        sku: Joi.string().min(Limits.SKU_MIN_LENGTH).max(Limits.SKU_MAX_LENGTH).required(),
        name: Joi.string().min(Limits.NAME_MIN_LENGTH).max(Limits.NAME_MAX_LENGTH).required(),
        description: Joi.string().min(Limits.DESC_MIN_LENGTH).max(Limits.DESC_MAX_LENGTH).required(),
        stockQuantity: Joi.number(),
        purchasePrice: Joi.number(),
        salePrice: Joi.number(),
        categories: Joi.array().items(Joi.string()),
        images: Joi.array().items(Joi.string()),
        attributes: Joi.array().items(Joi.object()),
    }).options({ allowUnknown: true });

    return schema.validate(product);
}
