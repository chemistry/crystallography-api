import { Firestore } from "@google-cloud/firestore";
import * as bodyParser from "body-parser";
import timeout from "connect-timeout";
import cors from "cors";
import express from "express";
import { Client } from 'elasticsearch';
import { getRouters } from "./routers";

export interface ExpresContext {
    log: (message: string) => void;
    PORT: number;
}

export async function startApplication(context: ExpresContext) {
    const { log } = context;
    log("application started");

    const app = express();

    const ES_KEY = process.env.ES_KEY || '';

    const firestore = new Firestore();
    const elasticSearch = new Client({
        host: 'http://search.crystallography.io',
        httpAuth: ES_KEY,
        apiVersion: '7.2',
    });
    elasticSearch.ping({
        requestTimeout: 30000,
    }, (error: any) => {
        if (error) {
            // tslint:disable-next-line
            console.error('Elasticsearch cluster is down!');
        } else {
            // tslint:disable-next-line
            console.log('successfully connected to elastic search');
        }
   });

    // Add UTF-8 symbols parser
    app.set("query parser", "simple");

    app.use(cors());

    app.use(timeout("10s"));

    app.use(bodyParser.urlencoded({ extended: true }));

    // Remove header
    app.disable("x-powered-by");

    // Serve static files
    app.get("/", (req, res) => {
      res.send("OK");
    });

    app.use("/api/v1", getRouters({ firestore, elasticSearch }));

    app.use((err: any, req: any, res: any, next: any) => {
        // tslint:disable-next-line
        console.error(err.stack);
        res.status(500).send('Something broke!');
    });

    return { app };
}
