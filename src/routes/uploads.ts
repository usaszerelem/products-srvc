import express, { Request, Response } from 'express';
import prodCanUpsert from '../middleware/prodCanUpsert';
import AppLogger from '../utils/Logger';
import { ErrorFormatter, ErrorToUserFriendly } from '../utils/ErrorFormatter';
import fs from 'fs';
import readline from 'readline';
import multer from 'multer';
import { isMainThread, Worker, workerData } from 'worker_threads';
import _ from 'underscore';
import { Upload } from '../models/uploads';
import IUploadDto from '../dtos/IUploadDto';
import { InitDatabase } from '../startup/database';
import { IProductDto, KeyValue } from '../dtos/IProductDto';
import { Product, validateProduct, productFieldNames } from '../models/product';
import assert from 'assert';

const logger = new AppLogger(module);
const router = express.Router();
const UploadFolder = 'public/uploadedFiles';

// For detailed information of how CSV file updated was implemented,
// please refer to this YouTube video
// https://www.youtube.com/watch?v=4sTmSlZDGow&ab_channel=OpenJavaScript

if (isMainThread === true) {
    // This is the main thread. Specify storage configuration options for
    // uploaded files.

    const storage = multer.diskStorage({
        destination: function (_req, _file, callback) {
            logger.info(`multer.destination: ${_file}`);
            callback(null, UploadFolder);
        },
        filename: function (_req, _file, callback) {
            logger.info(`multer.filename: ${_file}`);
            const filename = `file_${crypto.randomUUID()}.csv`;
            callback(null, filename);
        },
    });

    // Multer is a NPM package that helps with file uploading.
    const upload = multer({
        storage: storage,
        limits: {
            fileSize: 6_000_000,
        },
    });

    /**
     * For correct percentage calculation and to help the user/UI
     * we count the number of lines to process. This works for CSV
     * files, but in the future if JSON is to be parsed, a JSON
     * specific entity count needs tovbe created.
     * @param filePath - file to count lines in.
     * @returns - Number of CSV lines to process
     */
    async function countFileLines(filePath: string): Promise<number> {
        const promise = new Promise<number>((resolve, reject) => {
            let lineCount = 0;
            fs.createReadStream(filePath)
                .on('data', (buffer) => {
                    let idx = -1;

                    do {
                        idx = buffer.indexOf('\n', idx + 1);

                        // Do not count empty lines.
                        if (idx > 0) {
                            lineCount++;
                        }
                    } while (idx !== -1);
                })
                .on('end', () => {
                    resolve(lineCount);
                })
                .on('error', reject);
        });

        return await promise;
    }

    const middle = [prodCanUpsert, upload.single('file')];
    //const middle = [upload.single('file')];

    /**
     * @swagger
     * /api/v1/uploads:
     *   post:
     *     tags:
     *       - Uploads
     *     summary: Receive CSV files containing product information to be entered into the database.
     *     description: The CSV file can contain any number of fields, but the fields specified in the IProductsDto schema must be present. Field order does not matter, but the CSV file must have a field header first line.
     *     operationId: uploads
     *     parameters:
     *       - in: header
     *         name: x-auth-token
     *         required: true
     *         description: Authentication token of the logged in user
     *         schema:
     *           type: string
     *       - in: header
     *         name: file
     *         required: true
     *         description: FormData generated header information containing the name of the uploaded file
     *         schema:
     *           type: string
     *     responses:
     *       '201':
     *         description:  Successful receipt of CSV file and batch job creation started. The returned JSON object contains the job unique identifier that should be used with the GET method to poll the status of the CSV file processing.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/IUploadDto'
     */

    router.post('/', middle, async (req: Request, res: Response) => {
        logger.debug('File upload request received.');

        try {
            const numLines = await countFileLines(req.file!.path);
            console.log(`numLines: ${numLines}`);

            let upload = await new Upload({
                originalFileName: req.file?.originalname,
                entitiesToProcess: numLines - 1, // We do not count the CSV header
                entitiesSuccess: 0,
                entitiesFailed: 0,
                entitiesDuplicate: 0,
                percentProcessed: 0,
                percentSuccess: 0,
                percentFailed: 0,
                percentDuplicate: 0,
                completed: false,
                errorCode: '',
            } as IUploadDto).save();

            logger.info('Uploaded file received: ' + req.file?.originalname + ', jobId: ' + upload._id);

            const data: string = upload._id + '|' + upload.entitiesToProcess + '|' + req.file!.path;

            const worker = new Worker(__filename, {
                workerData: {
                    data,
                },
            });

            logger.info(worker !== undefined ? 'Worker created' : 'Worker create error');

            return res.status(200).json(upload);
        } catch (ex) {
            const msg = ErrorFormatter('Error Uploading File - ', ex, __filename);
            logger.error(msg);
            const ret = ErrorToUserFriendly(msg);
            return res.status(ret[0]).send(ret[1]);
        }
    });

    /**
     * @swagger
     * /api/v1/uploads:
     *   get:
     *     tags:
     *       - Uploads
     *     summary: Retreives the current status of a CSV file batch process.
     *     description: The batch process created using POST should be polled if completion status is of interest.
     *     operationId: uploadsJobStatus
     *     parameters:
     *       - in: header
     *         name: x-auth-token
     *         required: true
     *         description: Authentication token of the logged in user
     *         schema:
     *           type: string
     *       - in: header
     *         name: jobId
     *         required: true
     *         description: Unique batch processing job ID obtained from the POST call.
     *         example: 64adc0fe7a9c9d385950dfe2
     *         schema:
     *           type: string
     *     responses:
     *       '200':
     *         description: Found the batch job and current job status is being returned. Please see the IUploadDto schema for detail job information.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/IUploadDto'
     */

    router.get('/', middle, async (req: Request, res: Response) => {
        logger.debug('Get uploaded file processing status request received.');

        try {
            if (req.query.jobId) {
                const upload = (await Upload.findById(req.query.jobId as string)) as IUploadDto;

                if (_.isUndefined(upload) === true || upload === null) {
                    const errMsg = `Upload data with ID ${req.query.jobId} was not found`;
                    logger.error(errMsg);
                    return res.status(400).send(errMsg);
                } else {
                    logger.info('Upload data found: ' + upload._id);
                    logger.debug(JSON.stringify(upload));

                    return res.status(200).json(upload);
                }
            } else {
                const errMsg = `Upload jobId ${req.query.jobId} was not specified`;
                logger.error(errMsg);
                return res.status(400).send(errMsg);
            }
        } catch (ex) {
            const msg = ErrorFormatter('Error getting uploaded file processing status- ', ex, __filename);
            logger.error(msg);
            const ret = ErrorToUserFriendly(msg);
            return res.status(ret[0]).send(ret[1]);
        }
    });
} else {
    /**
     * Everything in this else statement is relevant when this same file is
     * launched as part of worker thread creation.
     */

    let csvHeader: string[] = [];

    enum LineProcessedStatus {
        Success,
        Failed,
        Duplicate,
    }

    /**
     * Analyzes the read CSV file and returns an array of fields that can be found
     * on the first line. This function also ensures that all the expected field
     * names are present.
     * @param line - line read to evaluate
     * @returns Array of strings of fields in the CSV file
     */
    function processCsvHeader(line: string): LineProcessedStatus {
        let status: LineProcessedStatus = LineProcessedStatus.Success;

        csvHeader = line.split(',');

        for (let i = 0; i < productFieldNames.length; i++) {
            let foundField = false;

            for (let j = 0; j < csvHeader.length; j++) {
                if (productFieldNames[i] === csvHeader[j]) {
                    foundField = true;
                    break;
                }
            }

            if (foundField === false) {
                status = LineProcessedStatus.Failed;
            }
        }

        if (status === LineProcessedStatus.Failed) {
            csvHeader = [];
        }

        return status;
    }

    function getFieldValue(field: string, fields: string[], headerArray: string[]): string {
        // Find the index of the field from the header array
        const idx = headerArray.findIndex(function (fld) {
            return fld === field;
        });

        if (idx === -1) {
            throw Error(`Invalid CSV file. Field ${field} is missing`);
        }

        // Now that we have the field index, read the value from the field array

        return fields[idx];
    }

    function parseLineToProductObj(line: string): IProductDto {
        const product: IProductDto = {} as IProductDto;

        const fields = line.split(',');

        product.isActive = true;
        product.sku = getFieldValue('sku', fields, csvHeader);
        product.name = getFieldValue('name', fields, csvHeader);
        product.description = getFieldValue('description', fields, csvHeader);
        product.stockQuantity = Number(getFieldValue('stockQuantity', fields, csvHeader));
        product.purchasePrice = Number(getFieldValue('purchasePrice', fields, csvHeader));
        product.salePrice = Number(getFieldValue('salePrice', fields, csvHeader));
        product.categories = getFieldValue('categories', fields, csvHeader).split('|');
        product.images = getFieldValue('images', fields, csvHeader).split(',');

        for (let attrIdx = 1; attrIdx <= 5; attrIdx++) {
            let kvp: KeyValue = {
                key: getFieldValue(`attrKey-${attrIdx}`, fields, csvHeader),
                value: getFieldValue(`attrValue-${attrIdx}`, fields, csvHeader),
            };

            if (kvp.key.length === 0 || kvp.value.length === 0) {
                break;
            }

            product.attributes.push(kvp);
        }

        return product;
    }

    /**
     * This function is called to ensure that there are no duplicate products
     * in the file that is being processed. Because the 'sku' field should be
     * unique for each product, this is the field that is used to ensure
     * uniquenes.
     * @param skuFind - The product sku to find the in the database
     * @returns Boolean 'true' if the sku field was found in the DB. False otherwise.
     */
    async function productExists(skuFind: string | undefined): Promise<boolean> {
        if (skuFind !== undefined) {
            return (await Product.findOne({ sku: skuFind })) !== null ? true : false;
        }

        return false;
    }

    /**
     * Processes one line read from the CSV file
     * @param line - line read to process
     * @returns Boolean value indicating success or failure
     */
    async function processLine(line: string): Promise<LineProcessedStatus> {
        let lineProcessed: LineProcessedStatus = LineProcessedStatus.Failed;

        try {
            assert(csvHeader.length > 0, 'Internal Error: csvHeader not initialized');

            const product = parseLineToProductObj(line);

            if ((await productExists(product.sku)) === true) {
                lineProcessed = LineProcessedStatus.Duplicate;
                logger.warn(`${product.sku} exists. Skipping duplicate`);
            } else {
                const { error } = validateProduct(product);

                if (error) {
                    throw Error(error.message);
                }

                let prod = new Product(product);
                prod = await prod.save();
                logger.info(`Saved: "${product.sku}"`);
                lineProcessed = LineProcessedStatus.Success;
            }
        } catch (ex) {
            const msg = ErrorFormatter('Error Uploading File ', ex, __filename);
            logger.error(msg);
        }

        return lineProcessed;
    }

    /**
     * Calculates upload progress and percentage of succeeded, failed and duplicate product
     * entries that were found in the provided product file.
     * @param status - Status of how the last line was processed.
     * @param uploadData Structure where the information is stored
     * @returns Updated structure of upload data
     */
    function updateUploadStatistics(status: LineProcessedStatus, uploadData: IUploadDto): IUploadDto {
        switch (status) {
            case LineProcessedStatus.Success:
                uploadData.entitiesSuccess++;
                uploadData.percentSuccess = Math.round((uploadData.entitiesSuccess * 100) / uploadData.entitiesToProcess);
                break;

            case LineProcessedStatus.Failed:
                uploadData.entitiesFailed++;
                uploadData.percentFailed = Math.round((uploadData.entitiesFailed * 100) / uploadData.entitiesToProcess);

                // this ensures that the progress bar always shows some value
                // when there are failures.

                if (uploadData.percentFailed === 0) {
                    uploadData.percentFailed = 1;
                }
                break;

            case LineProcessedStatus.Duplicate:
                uploadData.entitiesDuplicate++;
                uploadData.percentDuplicate = Math.round((uploadData.entitiesDuplicate * 100) / uploadData.entitiesToProcess);

                // this ensures that the progress bar always shows some value
                // when there are duplicate items.

                if (uploadData.percentDuplicate === 0) {
                    uploadData.percentDuplicate = 1;
                }
                break;

            default:
                throw Error(`Internal Error: Not recognized status: ${status}`);
        }

        const totalEntitiesProcessed = uploadData.entitiesSuccess + uploadData.entitiesFailed + uploadData.entitiesDuplicate;
        uploadData.percentProcessed = Math.round((totalEntitiesProcessed * 100) / uploadData.entitiesToProcess);

        return uploadData;
    }

    /**
     * This function reads the CSV file line by line and processes each line
     * @param file - CSV file to process
     * @param uploadData - Existing information about CSV file processing
     */
    async function processLineByLine(file: string, uploadData: IUploadDto) {
        let lineCount = 0;

        try {
            await InitDatabase();

            const rl = readline.createInterface({
                input: fs.createReadStream(file),
                crlfDelay: Infinity,
            });

            for await (const line of rl) {
                lineCount++;
                let headerStatus = LineProcessedStatus.Success;

                logger.debug(`${lineCount} - ${line}`);

                if (lineCount === 1) {
                    headerStatus = processCsvHeader(line);
                } else {
                    uploadData = updateUploadStatistics(await processLine(line), uploadData);
                }

                logger.debug(`Line: ${lineCount}, uploadStats: ` + JSON.stringify(uploadData, null, 2));

                // To prevent too frequent updates, which there isn't a need for,
                // we update the content of this record once for every 10 lines processed.

                if (lineCount % 10 === 0) {
                    await Upload.findByIdAndUpdate(uploadData._id, uploadData);
                }

                // The header must exists and be correctly formatted. If not then
                // this is considered as a fatal error.

                if (headerStatus === LineProcessedStatus.Failed) {
                    uploadData.completed = true;
                    uploadData.errorCode = 'BAD_CSV_HEADER';
                    logger.error('CSV file header is incorrectly formatted');
                    rl.close();
                }

                // If more items than checked for below failed, then fail the entire
                // CSV file processing. We shoud not fill up the database with garbage
                // and continue processing a potentially large bad CSV file.

                if (uploadData.entitiesFailed >= 10) {
                    uploadData.completed = true;
                    uploadData.errorCode = 'TOO_MANY_ERRORS';
                    logger.error('Too many errors. File processing was aborted.');
                    rl.close();
                }
            }

            uploadData.completed = true;
            await Upload.findByIdAndUpdate(uploadData._id, uploadData);
        } catch (ex) {
            const msg = ErrorFormatter('Error Uploading File - ', ex, __filename);
            logger.error(msg);
        } finally {
            fs.unlink(file, (err) => {
                if (err) {
                    logger.error(`Uploaded file delete error: ${err}`);
                } else {
                    logger.info(`Uploaded file deleted: ${file}`);
                }
            });
        }
    }

    /**
     * Function that is called by the worker thread when it starts to
     * start processing the use uploaded CSV file
     * @param data - The one and only parameter passed to this function
     * that contains:
     * jobId - Entity ID in the DB to update with job progress
     * entitiesToProcess - Number of lines in the CSV file to process.
     * uploadedFile - Uploaded CSV file path
     */
    async function processFile(data: string) {
        logger.debug(`Upload file worker thread. Received: ${data}`);

        const idx = data.indexOf('|');
        const jobId = data.substring(0, idx);
        const idx2 = data.indexOf('|', idx + 1);
        const entitiesToProcess = data.substring(idx + 1, idx2);
        const uploadedFile = data.substring(idx2 + 1);

        logger.debug(`ID: ${jobId}, count: ${entitiesToProcess}, file: ${uploadedFile}`);

        let uploadData: IUploadDto = {
            _id: jobId,
            entitiesToProcess: parseInt(entitiesToProcess),
            entitiesSuccess: 0,
            entitiesDuplicate: 0,
            entitiesFailed: 0,
            percentProcessed: 0,
            percentSuccess: 0,
            percentFailed: 0,
            percentDuplicate: 0,
            completed: false,
            errorCode: '',
        };

        await processLineByLine(uploadedFile, uploadData);

        logger.debug(`Worker thread terminating.`);
    }

    // Giddy up starting point for worker thread
    processFile(workerData.data);
}

export default router;
