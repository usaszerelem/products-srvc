import { Express } from 'express';
import AppLogger from '../utils/Logger';
import { InitDatabase } from './database';
import { OnUnhandledErrors } from './unhandledExceptions';
import { InitRoutes } from './routes';
import { GlobalServiceConfig } from './prod';
import { AppEnv, Env } from '../utils/AppEnv';

const logger = new AppLogger(module);

/**
 * Initializes service startup subsystems
 */
export async function ServerInit(expApp: Express): Promise<void> {
    logger.debug(`Log Level configured for: ` + AppEnv.Get(Env.LOG_LEVEL));
    logger.debug(`Console logging enabled: ` + AppEnv.Get(Env.CONSOLELOG_ENABLED));
    logger.debug(`File logging enabled: ` + AppEnv.Get(Env.FILELOG_ENABLED));

    logger.info('Service name: ' + AppEnv.Get(Env.SERVICE_NAME));
    logger.info('Loading: ./startup/prod');
    GlobalServiceConfig(expApp);

    logger.info('Loading: ./startup/database');
    await InitDatabase();

    logger.info('Loading ./startup/unhandledExceptions');
    OnUnhandledErrors();

    logger.info('Loading: ./startup/routes');
    InitRoutes(expApp);
}
