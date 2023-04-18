const express = require('express');
const router = express.Router();
const userAuth = require('../middleware/userAuth');
const prodCanUpsert = require('../middleware/prodCanUpsert');
const prodCanList = require('../middleware/prodCanList');
const prodCanDelete = require('../middleware/prodCanDelete');
const { Product, validateProduct } = require('../models/product.js');
const AppLogger = require('../utils/logger.js');
const logger = new AppLogger(module);
const _ = require('underscore');
const short = require('short-uuid');

// -------------------------------------------------

const fieldNames = [
    'sku', 'code', 'unitOfMeasure', 'materialID', 'description',
    'category', 'manufacturer', 'consumerUnits', 'multiPackDiscount',
    'isMultiCop', 'isMultiSkoal', 'isMultiRedSeal', 'pullPMUSA',
    'pullPMUSAAll', 'pullUSSTC', 'multiCanDiscount', 'isValidUPC'
];

// ---------------------------------------------------------------------------
// Create (register) a new product. This is a functionality exposed only to
// administrators. Therefore the caller must be authenticated and authorized
// to make this call.
// ---------------------------------------------------------------------------

router.post('/', [userAuth, prodCanUpsert], async (req,res) => {
    try {
        logger.debug('Inside POST, creating new product...');

        const { error } = validateProduct(req.body);

        if (error) {
            logger.error('Product information failed validation');
            return res.status(400).send(error.details[0].message);
        }

        let product = new Product( _.pick(req.body, fieldNames));
        product.productId = short.generate();
        await product.save();
        logger.info("Product was added. ProductID: " + product.productId);
        logger.debug(JSON.stringify(product));

        return res.status(200).json(product);
    } catch(ex) {
        logger.error(ex);
        return res.status(500).send(ex);
    }
});

// ---------------------------------------------------------------------------
// Update an existing product. This is a functionality exposed only to
// administrators. Therefore the caller must be authenticated and authorized
// to make this call.
// ---------------------------------------------------------------------------

router.put('/', [userAuth, prodCanUpsert], async (req,res) => {
    try {
        logger.debug('Inside Product PUT...');

        let productId = getProductIdFromRequest(req);
        logger.info('Updating product with ID: ' + productId);

        // Ensure product to update exists
        let product = await Product.get(productId);

        if (_.isUndefined(product) === true) {
            const errMsg = `Product with id ${productId} not found`;
            logger.error(errMsg);
            return res.status(404).send(errMsg);
        }

        product = new Product(req.body);
        product.productId = productId;

        // Prior to saving, validate that the new values conform
        // to our validation rules.
        const { error } = validateProduct(product);

        if (error) {
            logger.error('Product information failed validation');
            return res.status(400).send(error.details[0].message);
        }

        // Everything checks out. Save the product and return
        // update product JSON node
        await product.save();
        logger.info("Product was updated. ProductID: " + product.productId);
        logger.debug(JSON.stringify(product));
        return res.status(200).json(product);

    } catch(ex) {
        logger.error(ex);
        return res.status(500).send(ex);
    }
});

// ---------------------------------------------------------------------------
// Update an existing product. This is a functionality exposed only to
// administrators. Therefore the caller must be authenticated and authorized
// to make this call.
// ---------------------------------------------------------------------------

router.patch('/', [userAuth, prodCanUpsert], async (req,res) => {
    try {
        logger.debug('Inside Patch...');
        let productId = getProductIdFromRequest(req);
        logger.info('Patching product with ID: ' + productId);

        // Ensure product to update exists
        let product = await Product.get(productId);

        if (_.isUndefined(product) === true) {
            throw `Product with id ${productId} not found`;
        }

        // There is only need to specify keys that require to be updated
        // Enumerate each key to update, ensure that this key is within
        // the list of known keys and only then apply the value.

        let prodUpdateFields = new Product(req.body);

        Object.keys(prodUpdateFields).forEach(function(key) {
            logger.debug('Key : ' + key + ', Value : ' + prodUpdateFields[key]);

            if (fieldNames.indexOf(key) == -1) {
                let errMsg = 'Update key not recognized: ' + key;
                logger.error(errMsg);
                return res.status(400).send(errMsg);
            } else {
                product[key] = prodUpdateFields[key];
            }
        });

        // Prior to saving, validate that the new values conform
        // to our validation rules.
        const { error } = validateProduct(product);

        if (error) {
            logger.error('Product information failed validation');
            return res.status(400).send(error.details[0].message);
        }

        // Everything checks out. Save the product and return
        // update product JSON node
        await product.save();
        return res.status(200).json(product);
    } catch(ex) {
        logger.error(ex);
        return res.status(500).send(ex);
    }
});

// -------------------------------------------------

router.get('/', [userAuth, prodCanList], async (req,res) => {
    try {
        if (_.isUndefined(req.query.productId) === false ||
            _.isUndefined(req.query.sku) === false ||
            _.isUndefined(req.query.code) === false ) {

            let product = undefined;

            if (_.isUndefined(req.query.productId) === false ){
                logger.info(`Get Product by product ID: ${req.query.productId}`);
                product = await Product.get(req.query.productId);
            } else if (_.isUndefined(req.query.sku) === false ){
                logger.info(`Get Product by SKU: ${req.query.sku}`);
                product = await Product.scan({sku: {contains: req.query.sku}}).all().exec();
            }

            if (_.isUndefined(product) === false) {
                logger.info('Success! Returning: ' + JSON.stringify(product));
                return res.status(200).json(product);
            } else {
                let retStr = `Product not found. User ID ${req.query.id}`;
                logger.error(retStr);
                return res.status(404).send(retStr);
            }
        } else {
            // Get limit, which is the same as page size
            // lastKey, if any, is from the previous call so that the next
            // batch of products can be provided.
            const limit = parseInt(req.query.limit);
            const category = req.query.category;
            let lastKey = req.body.lastKey;
            let products = undefined;

            if (_.isUndefined(category) === true) {
                logger.info(`Requesting all products. Limit: ${limit} lastKey: ${lastKey}`);
                products = await Product.scan().limit(limit).startAt(lastKey).exec();
            } else {
                logger.info(`Requesting all products by category ${category}. Limit: ${limit} lastKey: ${lastKey}`);
                products = await Product.scan('category').eq(category).limit(limit).startAt(lastKey).exec();
            }

            logger.info(`Returning ${products.count} products`);
            logger.debug("lastKey: " + JSON.stringify(products.lastKey));

            lastKey = products.lastKey;
            const mergeObj = {
                products,
                lastKey
            };
            return res.status(200).json(mergeObj);
        }

    } catch(ex) {
        logger.error(ex);
        return res.status(500).send(ex);
    }
});

// ---------------------------------------------------------------------------
// Delete an existing product. This is a functionality exposed only to
// administrators. Therefore the caller must be authenticated and authorized
// to make this call.
// ---------------------------------------------------------------------------

router.delete('/', [userAuth, prodCanDelete], async (req,res) => {
    try {
        logger.debug('Inside Delete...');
                
        // Ensure product ID was provided
        if (_.isUndefined(req.query.productId) === true) {
            throw "productId not specified";
        }

        const product = await Product.get(req.query.productId);

        if (_.isUndefined(product) === true) {
            return res.status(404).send('Not found');
        } else {
            await Product.delete(req.query.productId);
            logger.info(`Product deleted ${req.query.productId}`);
            return res.status(200).send('Success');
        }
    } catch(ex) {
        logger.error(ex);
        return res.status(500).send(ex);
    }
});

// -------------------------------------------------
// Ensure product ID was provided. First check the HTTP query
// parameter. If not there check the JSON object within the
// message body.
function getProductIdFromRequest(req) {
    let productId = -1;

    if (_.isUndefined(req.query.productId) === false) {
        productId = req.query.productId;
    } else if (_.isUndefined(req.body.productId) === false) {
        productId = req.body.productId;
    } else {
        throw "productId not specified";
    }

    return productId;
}

// -------------------------------------------------

module.exports = router;
