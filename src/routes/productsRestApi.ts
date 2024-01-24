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
    'inStock',
    'stockQuantity',
    'purchasePrice',
    'salePrice',
    'categories',
    'images',
    'attributes',
];

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
