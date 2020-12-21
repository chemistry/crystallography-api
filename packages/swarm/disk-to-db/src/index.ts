import { MongoClient } from "mongodb";
import * as shell from "shelljs";
import { ExecOptions, ShellString } from "shelljs";
import { app, AppContext } from "./app";


const QUEUE_NAME = 'COD_FILE_UPDATED';

const getContext = async (): Promise<AppContext> => {

    await new Promise(res => setTimeout(res, 20000));
    const connection = await require('amqplib').connect('amqp://rabbitmq');
    const chanel = await connection.createChannel();
    await chanel.assertQueue(QUEUE_NAME);
    await chanel.prefetch(1);

    const {
        MONGO_INITDB_ROOT_USERNAME,
        MONGO_INITDB_ROOT_PASSWORD,
        MONGO_INITDB_HOST
    }  = process.env;

    let connectionString = `mongodb://${MONGO_INITDB_HOST}`;
    if (MONGO_INITDB_ROOT_USERNAME && MONGO_INITDB_ROOT_PASSWORD) {
        connectionString  = `mongodb://${MONGO_INITDB_ROOT_USERNAME}:${MONGO_INITDB_ROOT_PASSWORD}@${MONGO_INITDB_HOST}:27017`;
    }
    const mongoClient = await MongoClient.connect(connectionString, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });

    const db = mongoClient.db("crystallography");

    process.on('exit', (code) => {
         // tslint:disable-next-line
        console.log(`About to exit with code: ${code}`);
        mongoClient.close();
        chanel.close();
    });

    return {
        log: (message: string) => {
            // tslint:disable-next-line
            console.log(message);
        },
        getChanel: () => {
            return chanel;
        },
        exec: (command: string, options?: ExecOptions & { async?: false }): ShellString => {
            return shell.exec(command);
        },
        db,
        QUEUE_NAME
    }
}

(async () => {
    try {
        const context = await getContext();

        // tslint:disable-next-line
        console.time('application start');
        await app(context);

        // tslint:disable-next-line
        console.timeEnd('application start');
    } catch(e) {
        // tslint:disable-next-line
        console.error(e);
        process.exit(-1);
    }
})();