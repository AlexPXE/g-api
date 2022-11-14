"use strict";
import { Worker } from 'worker_threads';
import path from 'path';
import {
    cliRunnerFactory,    
    ytBackup,
    ytRestore,
    JsonDB,
    START_DIR
} from '../index.js';


/**
 * 
 * @param {Object} options
 * @param {string} options.serverUrl
 * @param {string} options.dbPath
 * @param {Object} options.ytAPI
 * @param {Array} options.ytAPI.scopes
 * @param {string} options.ytAPI.tokenDir
 * @param {string} options.ytAPI.tokenFN
 * @param {string} options.ytAPI.clientSecretDir
 * @param {Object} options.ytAPI.clientSecretFN
 */
function runner(options) {
    const db =  new JsonDB();
    db.load(options.dbPath);

    const cliRunner = cliRunnerFactory.runner("yt-backup", "RUNNER>")
        .set(
            "server",
            "Server start. server [serverUrl] example: server http://localhost:3000",
            async ([serverUrl = options.serverUrl]) => {
                try {                    
                    const serverWorker = new Worker(
                        path.join(START_DIR, 'server', 'server.js'),
                        { workerData: serverUrl }
                    );

                    serverWorker.on("message", ({type, data}) => {
                        switch(type) {
                            case "log":
                                cliRunner.logger(data);
                                return;

                            case "data":
                                const parsedData = JSON.parse(data);

                                if (parsedData.name !== undefined) {
                                    db.set(parsedData.name, parsedData);

                                    cliRunner.logger({
                                        typeMsg: "info",
                                        msg: `Data with key "${parsedData.name}" is cached.`
                                    });

                                } else {
                                    cliRunner.logger({
                                        typeMsg: "warn",
                                        msg: "The data was not cached because the 'name' parameter is missing."
                                    });
                                }
                                return;

                            case "query":
                                const queryResult = db.get(data);

                                if (queryResult === undefined) {
                                    cliRunner.logger({ typeMsg: "warn", msg: "Data not fond." });
                                }

                                cliRunner.logger({
                                    typeMsg: "info",
                                    msg: `|Query| key: "${data}", result: ${queryResult}`
                                });

                                serverWorker.postMessage(queryResult);
                                return;

                            default:
                                cliRunner.logger({ typeMsg: "warn", msg: "Unknown message type." });
                        }                        
                    });                   

                } catch(e) {
                    cliRunner.logger({typeMsg :"err", msg: `The server has not been started: ${e}`});
                }            
            }

        ).set(//REFACTOR IT
            "backup",
            "Get data (playlists, playlist items, subscriptions) and store them in the database.",
            async () => await ytBackup(options.ytAPI, options.dbPath)
            
        ).set(//REFACTOR IT
            "restore",
            "Restore data (playlists, playlist items, subscriptions)",
            async () => await ytRestore(options.ytAPI, options.dbPath)
        ) //IMPLEMENT: save and load methods
    ;

    cliRunner.start();
}

export { runner }
