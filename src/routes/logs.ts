import express, { Request, Response } from 'express';
import AppLogger from '../utils/Logger';
import { ErrorFormatter } from '../utils/ErrorFormatter';

const logger = new AppLogger(module);
const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     ILogDto:
 *       type: object
 *       description: Array of log objects that were generated on the browser side application.
 *       properties:
 *         logs:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               time:
 *                 type: string
 *                 example: 2023-07-19T01:40:24Z
 *                 description: ISO 8601 formatted timestamp
 *               level:
 *                 type: string
 *                 enum: [error, warn, info, debug]
 *                 example: info
 *               msg:
 *                 type: string
 *                 example: Delete clicked on product ID 64a8c7f335ae986c434b6961
 */

interface ILogEntry {
    time: string;
    level: string;
    msg: string;
}

interface ILogDto {
    logs: ILogEntry[];
}

/**
 * @swagger
 * /api/v1/logs:
 *   post:
 *     tags:
 *       - Logs
 *     summary: Receive logs generated by the Product Manager UI.
 *     description: This endpoint is to be the central collection point for all logs from the user interface. These logs can in turn be sent to one or more sources, dependent on how the service is configured. Example of log colelction sources where the logs can be sent are; cosole, circular log files, MongoDB, AtlasDB. Logstash, Cloudwatch. Only authenticated users can call this endpoint.
 *     operationId: createLogs
 *     parameters:
 *       - in: header
 *         name: x-auth-token
 *         required: true
 *         description: Authentication token of the logged in user
 *         schema:
 *           type: string
 *     requestBody:
 *       description: Array of logs generated on the browser side. See the ILogDto schema for detailed information on the log entries.
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ILogDto'
 *     responses:
 *       '200':
 *         description: Successful receipt of the provided log data.
 */
router.post('/', async (req: Request, res: Response) => {
    try {
        const LogSource: string = 'product-mgr-ui';

        const payload: ILogDto = req.body;

        for (let i = 0; i < payload.logs.length; i++) {
            const logEntry = payload.logs[i];

            if (logEntry.level === 'error') {
                logger.error(LogSource, logEntry);
            } else if (logEntry.level === 'warn') {
                logger.warn(LogSource, logEntry);
            } else if (logEntry.level === 'info') {
                logger.info(LogSource, logEntry);
            } else if (logEntry.level === 'debug') {
                logger.debug(LogSource, logEntry);
            } else {
                logger.error('Unrecognized log entry', logEntry);
            }
        }

        return res.status(200).send('Success');
    } catch (ex) {
        const msg = ErrorFormatter('Fatal error in User POST', ex, __filename);
        logger.error(msg);
        return res.status(500).send(msg);
    }
});

export default router;
