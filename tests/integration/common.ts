import mongoose from 'mongoose';
import { ServerInit } from '../../src/startup/serverInit';
import { Server } from 'http';
import express, { Express } from 'express';
import { Product } from '../../src/models/product';

const app: Express = express();

export interface StartupReturn {
    server: Server | null;
    adminId: mongoose.Types.ObjectId;
    adminAuthToken: string;
}

export async function Startup(): Promise<StartupReturn> {
    await ServerInit(app);

    //console.log('ServerInit() should be completed.');

    let retObj: StartupReturn = {
        server: null,
        adminId: new mongoose.Types.ObjectId(),
        adminAuthToken: '',
    };

    //console.log('Asking server to listen on port 3001');
    retObj.server = app.listen(3001, async () => {});
    //console.log('Server should be listening on port 3001. Server object is: ' + retObj.server);

    return retObj;
}

export async function Shutdown(server: Server | null): Promise<void> {
    await Product.deleteMany({})
        .then(async function () {
            await mongoose.connection.close();
        })
        .catch(function (_error: any) {
            //console.log(error);
        });

    if (server !== null) {
        server.close();
    }
}
