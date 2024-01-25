import express, { Request, Response } from 'express';
import AppLogger from '../utils/Logger';
import { Product, validateProduct } from '../models/product';
import _ from 'underscore';
import { ErrorFormatter, ErrorToUserFriendly } from '../utils/ErrorFormatter';
import { IProductDto } from '../dtos/IProductDto';
import { IPagedDataReturn } from '../dtos/IPagedDataReturn';
import parseBool from '../utils/parseBool';
import isUndefOrEmpty from '../utils/isUndefOrEmpty';

const logger = new AppLogger(module);
const router = express.Router();

export const productFieldNames: string[] = [
    'isActive',
    'sku',
    'name',
    'description',
    'stockQuantity',
    'purchasePrice',
    'salePrice',
    'categories',
    'images',
    'attributes',
];

/**
 * @swagger
 * /api/v1/products:
 *   post:
 *     tags:
 *       - Products
 *     summary: Create/Add a new Product
 *     description: Create (register) a new product. This is a functionality exposed only to logged in user that has 'ProductUpsert' operational permission.
 *     operationId: createProduct
 *     parameters:
 *       - in: header
 *         name: x-auth-token
 *         required: true
 *         description: Authentication token of the logged in user
 *         schema:
 *           type: string
 *     requestBody:
 *       description: Information about the product to create. Note that the product's unique identifier as well as the createdAt and updatedAt fields are not required, but these are returned as part of the response. See the IProductCreateDto schema for detailed information.
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IProductDto'
 *     responses:
 *       '201':
 *         description: Product created. The returned JSON contains the product's unique identifier as well as the createdAt and updatedAt fields.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IPagedDataReturnDto'
 *       '403':
 *         description: Forbidden upserting products
 *       '409':
 *         description: There is already a product with this UPC in the database.
 *       '424':
 *         description: Product information was saved but auditing is enabled and the audit server is not available.
 */
router.post('/', async (req: Request, res: Response) => {
    try {
        logger.debug('Inside POST, creating new product...');

        const productInfo = {
            ..._.pick(req.body, productFieldNames),
        };

        const { error } = validateProduct(productInfo);

        if (error) {
            logger.error(error.message);
            return res.status(400).send(error.details[0].message);
        }

        let product = new Product(productInfo);
        product = await product.save();

        logger.info('Product was added. entityId: ' + product._id);
        logger.debug(JSON.stringify(product));

        return res.status(201).json(product);
    } catch (ex) {
        const msg = ErrorFormatter('Error Adding Product - ', ex, __filename);
        logger.error(msg);
        const ret = ErrorToUserFriendly(msg);
        return res.status(ret[0]).send(ret[1]);
    }
});

/**
 * @swagger
 * /api/v1/products/{id:}:
 *   put:
 *     tags:
 *       - Products
 *     summary: Update all fields for a Product type entity
 *     description: Updates an existing Product's information. Updating can only be done by a logged in user that has 'ProductUpsert' operational permission.
 *     operationId: putProduct
 *     parameters:
 *       - in: header
 *         name: x-auth-token
 *         required: true
 *         description: Authentication token of the logged in user
 *         schema:
 *           type: string
 *       - in: query
 *         name: id
 *         required: true
 *         description: Unique product entity identifier to update
 *         schema:
 *           type: string
 *     requestBody:
 *       description: Information about the product to update.
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IProductDto'
 *     responses:
 *       '200':
 *         description: Product was updated. The returned JSON contains the updated product. Three additional fields are returned that are not shown below are the '_id', 'createdAt' and 'updatedAt' fields.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IProductDto'
 *       '403':
 *         description: Forbidden upserting products
 *       '404':
 *         description: Specified entity could not be found.
 *       '424':
 *         description: Product information was saved but auditing is enabled and the audit server is not available.
 */

router.put('/:id', async (req: Request, res: Response) => {
    try {
        const prodId = req.params.id;
        logger.info('Updating product with ID: ' + prodId);

        // Ensure product to update exists

        if ((await Product.findById(prodId)) === null) {
            const errMsg = `Product with id ${prodId} not found`;
            logger.error(errMsg);
            return res.status(404).send(errMsg);
        }

        const productInfo = {
            ..._.pick(req.body, productFieldNames),
        };

        // Prior to saving, validate that the new values conform
        // to our validation rules.
        const { error } = validateProduct(productInfo);

        if (error) {
            logger.error('Product information failed validation');
            return res.status(400).send(error.details[0].message);
        }

        logger.debug(JSON.stringify(productInfo, null, 2));

        // Everything checks out. Save the product and return
        // update product JSON node
        const product = await Product.findByIdAndUpdate(prodId, productInfo, { new: true });

        logger.info('Product was updated. Id: ' + prodId);
        logger.debug(JSON.stringify(product));

        return res.status(200).json(product);
    } catch (ex) {
        const msg = ErrorFormatter('Error in Product PUT', ex, __filename);
        logger.error(msg);
        return res.status(500).send(msg);
    }
});

/**
 * @swagger
 * /api/v1/products{id:}:
 *   patch:
 *     tags:
 *       - Products
 *     summary: Update all or some fields for a Product type entity
 *     description: Updates to selective fields only for an existing Produc. Updating can only be done by a logged in user that has 'ProductUpsert' operational permission.
 *     operationId: patchProduct
 *     parameters:
 *       - in: header
 *         name: x-auth-token
 *         required: true
 *         description: Authentication token of the logged in user
 *         schema:
 *           type: string
 *       - in: query
 *         name: id
 *         required: true
 *         description: Unique product entity identifier to update
 *         schema:
 *           type: string
 *     requestBody:
 *       description: Information about the product to update. At least one field from the below shown schema should be present. If all fields are provided then the 'patch' method is identical to the 'put' method.
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IProductDto'
 *     responses:
 *       '200':
 *         description: Product was updated. The returned JSON contains the product's unique identifier as well as the createdAt and updatedAt fields.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IProductDto'
 *       '403':
 *         description: Forbidden upserting products
 *       '404':
 *         description: Specified entity could not be found.
 *       '424':
 *         description: Product information was saved but auditing is enabled and the audit server is not available.
 */
router.patch('/:id', async (req: Request, res: Response) => {
    try {
        const prodId = req.params.id;
        logger.info('Patching product with ID: ' + prodId);

        let productInfo = await updateProductObject(prodId, req.body);

        if (productInfo === null) {
            const errMsg = `Product with id ${prodId} not found`;
            logger.error(errMsg);
            return res.status(404).send(errMsg);
        }

        // Prior to saving, validate that the new values conform
        // to our validation rules.

        const { error } = validateProduct(productInfo);

        if (error) {
            logger.error('Product information failed validation');
            return res.status(400).send(error.details[0].message);
        }

        const product = await Product.findByIdAndUpdate(prodId, productInfo, { new: true });

        logger.info('Product was patched. entityId: ' + product._id);
        logger.debug(JSON.stringify(product));

        return res.status(200).json(product);
    } catch (ex) {
        const msg = ErrorFormatter('Error in Product PATCH', ex, __filename);
        logger.error(msg);
        return res.status(500).send(msg);
    }
});

async function updateProductObject(entityId: string, newBody: any): Promise<IProductDto | null> {
    let productRet: IProductDto | null;

    try {
        const product = await Product.findById(entityId);
        let prodUpdateFields: any = { ...newBody };

        // There is only need to specify keys that require to be updated
        // Enumerate each key to update, ensure that this key is within
        // the list of known keys and only then apply the value.

        Object.keys(prodUpdateFields).forEach((key) => {
            if (productFieldNames.indexOf(key) == -1) {
                let errMsg = 'Product key not recognized: ' + key;
                logger.error(errMsg);
            } else {
                logger.debug(`Updating product Key: ${key}, Value: ${product[key]} with Value: ${prodUpdateFields[key]}`);
                product[key] = prodUpdateFields[key];
            }
        });

        productRet = product;
    } catch (ex) {
        const msg = ErrorFormatter('Error in Product PATCH', ex, __filename);
        logger.error(msg);
        productRet = null;
    }

    return productRet;
}

/**
 * @swagger
 * /api/v1/products/{:id}:
 *   get:
 *     tags:
 *       - Products
 *     summary: Get product information using the products's unique entity identifier.
 *     description: A logged in user or a service account can obtain information about users only if this user has 'userCanList' operational access rights given to it.
 *     operationId: getProductInfo
 *     parameters:
 *       - in: header
 *         name: x-auth-token
 *         required: true
 *         description: authentication token of the logged in user
 *         schema:
 *           type: string
 *       - in: query
 *         name: id
 *         required: false
 *         description: Unique product id of the product whose information is requested. Provide either this or the the product's UPC number.
 *         example: 64bf5ba4d0c8d93ad3ea47e3
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Array of found products that met the criterie.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IProductDto'
 *       '400':
 *         description: Invalid token/Bad Request
 *       '424':
 *         description:  Product information was retrieved, but auditing is enabled and the Audit server is not available.
 */
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const prodId = req.params.id;
        logger.debug(`Product GET request for ID: ${prodId}`);

        const product = await Product.findById(prodId as string);

        if (_.isUndefined(product) === true || product === null) {
            const errMsg = `Product with ID ${prodId} was not found`;
            console.error(errMsg);
            return res.status(400).send(errMsg);
        } else {
            logger.info('Product found: ' + product._id);
            logger.debug(JSON.stringify(product));

            return res.status(201).json(product);
        }
    } catch (ex) {
        const msg = ErrorFormatter('Error in Product GET', ex, __filename);
        logger.error(msg);
        return res.status(500).send(msg);
    }
});

/**
 * @swagger
 * /api/v1/products:
 *   get:
 *     tags:
 *       - Products
 *     summary: Retrieves a list of products using any of the products's properties as a query parameter. As an example all products with 'ABC' in the 'sku' field. Maximum 100 products can be requested in one call.
 *     description: A logged in user or a service account can retreive information about several products in one call. This greatly improves efficiency. Loggen in users with 'userCanList' operational access rights can make this call.
 *     operationId: getProductInfo
 *     parameters:
 *       - in: header
 *         name: x-auth-token
 *         required: true
 *         description: authentication token of the logged in user
 *         schema:
 *           type: string
 *       - in: query
 *         name: pageSize
 *         required: false
 *         description: Maximum number of products to return in one page. If not specified the default value of 10 is used.
 *         example: 10
 *         schema:
 *           type: number
 *       - in: query
 *         name: pageNumber
 *         required: false
 *         description: The specific page number of pageSize items that is requested. If not specified the default value of 1 is used.
 *         example: 1
 *         schema:
 *           type: number
 *       - in: query
 *         name: sortBy
 *         required: false
 *         description: In case there is an interest to sort the returned information by a product property, specify the property name here.
 *         example: upc
 *         schema:
 *           type: string
 *     requestBody:
 *       description: Optionally the list of fields to retrieve. This way the caller can specify exactly what it needs and only that information is returned.
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Categories that this product belongs to.
 *             properties:
 *               select:
 *                 type: array
 *                 items:
 *                   type: string
 *             items:
 *               type: string
 *             example: { "select": ["_id", "sku", "name", "description"] }
 *     responses:
 *       '200':
 *         description: Found the requested product. All product details are in the body of the response.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IProductsFilterResponse'
 *       '400':
 *         description: Invalid token/Bad Request
 *       '413':
 *         description: Payload too large. Max page size allowed is 100
 *       '424':
 *         description:  Product information was retrieved, but auditing is enabled and the Audit server is not available.
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        logger.debug(`Product GET request`);

        const result = await getProductsByField(req);

        if (typeof result[1] === 'string') {
            return res.status(result[0]).send(result[1]);
        } else {
            return res.status(result[0]).json(result[1]);
        }
    } catch (ex) {
        const msg = ErrorFormatter('Error in Product GET', ex, __filename);
        logger.error(msg);
        return res.status(500).send(msg);
    }
});

/**
 * @swagger
 * /api/v1/products/{:id}:
 *   delete:
 *     tags:
 *       - Products
 *     summary: Delete a product from the database using its unique entity ID
 *     description: A logged in user can delete a product only if this user has 'ProdDelete' operational access rights given to it.
 *     operationId: deleteProduct
 *     parameters:
 *       - in: header
 *         name: x-auth-token
 *         required: true
 *         description: authentication token of the logged in user
 *         schema:
 *           type: string
 *       - in: query
 *         name: entityId
 *         required: true
 *         example: 64a8c7eb35ae986c434b0b1a
 *         schema:
 *           type: string
 *       - in: query
 *         name: hardDelete
 *         required: false
 *         description: Optional boolean value that specifies whether a soft or a hard delete is requested. By default a soft delete is performed.
 *         example: false
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Product deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IProductDto'
 *       '400':
 *         description: Invalid token.
 *       '404':
 *         description: Not found
 *       '424':
 *         description: Product was deleted, but auditing is enabled and the Audit server is not available.
 */

router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const prodId = req.params.id;
        logger.debug(`Product DELETE request for ID: ${prodId}`);

        let entity;

        if (req.query.hardDelete === 'true') {
            entity = await Product.findByIdAndDelete(prodId as string);
        } else {
            entity = await Product.findByIdAndUpdate(prodId, { isActive: false }, { new: true });
        }

        if (_.isUndefined(entity) === true || entity === null) {
            return res.status(404).send('Not found');
        } else {
            let msg: string;

            if (req.query.hardDelete === 'true') {
                msg = `Product deleted ${prodId}`;
            } else {
                msg = `Product marked as inactive ${prodId}`;
            }

            logger.info(msg);

            return res.status(200).json(entity);
        }
    } catch (ex) {
        const msg = ErrorFormatter('Error in Product DELETE', ex, __filename);
        logger.error(msg);
        return res.status(500).send(msg);
    }
});

/**
 *
 * @param fieldRequested Return a JSON object that specified to the database
 * the list of fields that the user is requesting.
 * @returns JSON object listing requested fields.
 */
function selectFields(fieldRequested: string[]) {
    var obj: any = {};

    if (fieldRequested !== undefined) {
        fieldRequested.forEach((field) => {
            obj[field] = 1;
        });
    }

    return obj;
}

/**
 *
 * @param sortBy - optional field that information is requested to be sorted by
 * @returns JSON object for DB query to sort by requested field
 */
function getSortField(sortBy: string | undefined) {
    var obj: any = {};

    if (sortBy !== undefined) {
        obj[sortBy] = 1;
    }

    return obj;
}

/**
 *
 * @param {req } - Request object so that we can access query parameters
 * @param field - Product object field that we would like to search on. As an example 'upc'
 * @returns touple with HTTP Status code as key and either an error or product
 * object as value.
 */
async function getProductsByField(req: Request): Promise<[number, IPagedDataReturn<IProductDto> | string]> {
    const maxPageSize: number = 100;
    logger.debug('Inside getProductsByField');

    const pageSize: number = req.query.pageSize ? +req.query.pageSize : 10;

    if (pageSize > maxPageSize) {
        const msg = `Payload too large. Max page size allowed is ${maxPageSize}`;
        logger.error(msg);
        return [413, msg];
    }

    const filter = getFilterSetting(req.query.filterByField as string, req.query.filterValue as string, req.query.isActive as string);

    const pageNumber: number = req.query.pageNumber ? +req.query.pageNumber : 1;
    const getFields = selectFields(req.body.select);
    const sortField = getSortField(req.query.sortBy as string);

    logger.debug(`pageNumber: ${pageNumber}`);
    logger.debug(`pageSize: ${pageSize}`);
    logger.debug('filter: ' + JSON.stringify(filter));
    logger.debug('sortField: ' + JSON.stringify(sortField));
    logger.debug('Requested return fields: ' + JSON.stringify(getFields));

    const products = await Product.find(filter)
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize)
        .sort(sortField)
        .select(getFields);

    const fullUrl: string = req.protocol + '://' + req.get('host') + req.originalUrl;
    const response = buildResponse<IProductDto>(fullUrl, pageNumber, pageSize, products);

    logger.debug('Returning: ' + JSON.stringify(response));
    logger.info('Success');
    return [200, response];
}

/**
 * This function builds the return object that is returned from the GET call where
 * several products are returned. Paging help is provided.
 * @param req - HTTP Request object
 * @param pageNumber - Current page number that was requested
 * @param pageSize - Page size that was requested
 * @param products - Array of products that are returned
 * @returns {ProductsReturn} - JSON object of type ProductsReturn
 */
function buildResponse<T>(fullUrl: string, pageNumber: number, pageSize: number, products: T[]): IPagedDataReturn<T> {
    const idx = fullUrl.lastIndexOf('?');

    if (idx !== -1) {
        fullUrl = fullUrl.substring(0, idx);
    }

    let response: IPagedDataReturn<T> = {
        pageSize: pageSize,
        pageNumber: pageNumber,
        _links: {
            base: fullUrl,
        },
        results: products,
    };

    if (pageNumber > 1) {
        response._links.prev = fullUrl + `?pageSize=${pageSize}&pageNumber=${pageNumber - 1}`;
    }

    if (products.length === pageSize) {
        response._links.next = fullUrl + `?pageSize=${pageSize}&pageNumber=${pageNumber + 1}`;
    }

    return response;
}

function getFilterSetting(filterByField: string, filterByValue: string, reqIsActive: string | undefined) {
    // Per current RegEx implementation, fields that we can search on should be of type string

    const isString: boolean = productFieldNames.find((f) => f === filterByField) ? true : false;

    // If the caller requested that all products regardless of whether it is active or deleted should be returned
    // then set isActive to undefined. Otherwise the query parameter is expected to be a Boolean value
    let isActive: boolean | undefined;

    if (reqIsActive === 'all') {
        isActive = undefined;
    } else if (reqIsActive === undefined) {
        isActive = true;
    } else {
        isActive = parseBool(reqIsActive as string);
    }

    return getFilter(filterByField as string, filterByValue, isString, isActive);
}

/**
 * This method constructs an object for the database to filter documents
 * @param filterByField - optional query parameter to field name to filter by
 * @param filterValue - value to filter by
 * @param isString - whether to use RegEx to search string field
 * @param isActive - By default only active products are returned
 * @returns JSON object for DB to filter on.
 */
function getFilter(
    filterByField: string | undefined,
    filterValue: string | undefined,
    isString: boolean,
    isActive: boolean | undefined
) {
    var obj: any = {};

    if (isActive !== undefined) {
        obj['isActive'] = isActive;
    }

    if (isUndefOrEmpty(filterByField) == false && isUndefOrEmpty(filterValue) == false) {
        const value = filterValue!.toString().trim().toLowerCase();

        if (value === 'true' || value === 'false') {
            obj[filterByField!] = value === 'true' ? true : false;
        } else if (isString === true) {
            var reg: any = {};
            reg['$options'] = 'i';
            reg['$regex'] = filterValue;
            obj[filterByField!] = reg;
        } else {
            obj[filterByField!] = parseInt(filterValue!);
        }
    }

    return obj;
}

export default router;
