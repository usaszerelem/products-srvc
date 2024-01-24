import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';

export function GlobalServiceConfig(app: Express) {
    app.use(helmet());
    app.use(compression());
    app.use(express.json());

    // Parses urlencoded bodies and only looks at requests where
    // 'Content-Type' header matches the type option.
    // This is a global option, but route specific middleware settings
    // can be created if needed.
    // extended: true indicates the lgorithm complexity that should be
    // used to decode the encoded string
    // limit specifies the upper limit in bytes for the payload. Default is 100K
    // parameterLimit specified the max number of query parameters allowed.

    app.use(
        express.urlencoded({
            extended: true,
            limit: 6_000_000,
            parameterLimit: 3,
        })
    );
    app.use(cors());
}
