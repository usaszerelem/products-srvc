/**
 * @swagger
 * components:
 *   schemas:
 *     IUploadDto:
 *       required:
 *         - _id
 *         - entitiesToProcess
 *         - entitiesSuccess
 *         - entitiesFailed
 *         - percentProcessed
 *         - percentSuccess
 *         - percentFailed
 *         - percentDuplicate
 *         - completed
 *         - errorCode
 *       type: object
 *       description: Used in combination with the upload CSV file API to find out what is the current status of the file upload job.
 *       properties:
 *         _id:
 *           type: string
 *           example: 64adc0fe7a9c9d385950dfe2
 *           description: Use this unique number to refer to the job ID and this is the response for that job.
 *         entitiesToProcess:
 *           type: number
 *           description: Number of entities to process in this job
 *           example: 100
 *         entitiesSuccess:
 *           type: number
 *           description: Number of entities successfully processed up to this point.
 *           example: 70
 *         entitiesFailed:
 *           type: number
 *           description: Number of entities failed to be processed due to errors.
 *           example: 5
 *         percentProcessed:
 *           type: number
 *           description: Percent processed of total entitites to process.
 *           example: 75
 *         percentSuccess:
 *           type: number
 *           description: Percent of entities successfully processed.
 *           example: 70
 *         percentFailed:
 *           type: number
 *           description: Percent of entities that could not be processed.
 *           example: 5
 *         percentDuplicate:
 *           type: number
 *           description: Percent of entities that exists in the database
 *           example: 0
 *         completed:
 *           type: boolean
 *           description: Indicates whether processing of CSV data completed or whether in progress.
 *           example: false
 *         errorCode:
 *           type: string
 *           description: Indicates error that happened. Code is used for translation purposes.
 *           example: BAD_CSV_HEADER - CSV file header is incorrectly formatted, TOO_MANY_ERRORS - Too many errors. File processing was aborted.
 */

export default interface IUploadDto {
    _id?: string;
    entitiesToProcess: number;
    entitiesSuccess: number;
    entitiesFailed: number;
    entitiesDuplicate: number;
    percentProcessed: number;
    percentSuccess: number;
    percentFailed: number;
    percentDuplicate: number;
    completed: boolean;
    errorCode: string;
}
