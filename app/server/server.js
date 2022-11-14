"use strict"

import { workerData, parentPort} from "worker_threads";
import { EventEmitter } from 'node:events';
import * as fs from 'fs/promises';;
import http from 'http';
import { URL } from 'node:url';
import path from 'path';
import { fileURLToPath } from 'url';
import { START_DIR } from "../index.js";


const
    __filename = fileURLToPath( import.meta.url),        
    __direname = path.dirname(__filename)
;

startServer(workerData);

/**
 * 
 * @param {Object} options
 * @param {string} options.serverUrl
 * @param {string} options.dbPath
 */
async function startServer(serverUrl = path.join(START_DIR, "server/server.js")) {
    
    const
        sendMsg = {
            log(typeMsg, msg) {
                parentPort.postMessage({
                    type: "log",
                    data: {
                        typeMsg,
                        msg
                    }
                });                
            },
            data(data) {
                parentPort.postMessage({
                    type: "data",
                    data
                });
            },
            query(key) {                
                return new Promise((res, rej) => {
                    const tId = setTimeout(() => {
                        rej("Main thread not responding.");
                    }, 3000);

                    parentPort.once("message", (data) => {
                        clearInterval(tId);
                        res(data);
                    });

                    parentPort.postMessage({
                        type: "query",
                        data: key
                    });
                });
            }
        },
        serverURL = new URL(serverUrl),        
        
        routes = new Map([            
            [
                '/oauth2callback',
                async (req, resp, method, sParams) => {
                    resp.writeHead(200, {
                        'Content-Type': "text/html",
                    });
                    resp.write(`<div>${sParams.get('code')}</div>`);
                }
            ],
            [
                '/backup',
                async (req, resp, method, sParams) => {
                    let 
                        status = 404,
                        receivedData = ''                        
                    ;

                    if (method === 'POST') {
                        for await (let chank of req) {
                            receivedData += chank;
                        }

                        sendMsg.data(receivedData);
                        status = 200;                        
                    }
                    
                    resp.writeHead(status, {                        
                        'Access-Control-Allow-Origin': '*'
                    });
                }
            ],
            [
                '/restore',
                async (req, resp, method, sParams) => {
                    try {
                        if (method === 'GET') {
                            const data = await sendMsg.query( sParams.get('name') );

                            if (data !== undefined) {
                                resp.writeHead(200, {           
                                    'Content-Type': "application/json",
                                    'Access-Control-Allow-Origin': '*'
                                });
                                
                                resp.write( JSON.stringify(data) );
                            } else {
                                throw new Error("Data not found.");
                            }

                        } else {
                            throw new Error(`Method ${method} not supported.`);
                        }

                    } catch(e) {                        
                        resp.writeHead(404, e.message);
                    }
                }
            ],
            [
                '/',
                async (req, resp, method) => {
                    let status = 200;

                    if (method !== 'OPTIONS') {
                        status = 404;
                    }

                    resp.writeHead(status, {
                        "Allow": 'POST, GET, OPTIONS',
                        "Access-Control-Allow-Origin": "*",
                        "Access-Control-Allow-Methods": 'POST, GET, OPTIONS',
                        "Access-Control-Allow-Headers": "Content-type"
                    });
                }
            ]
        ]),        
        server = http.createServer( routerFactory(serverURL, routes) )
    ;
    
    try {
        server.listen(serverURL.port, serverURL.hostname, () => {
            sendMsg.log("info", `Server started successfully. URL: ${serverURL}`);            
        });

    } catch(e) {
        sendMsg.log("err", `The server has not been started. ${e}`);
        process.exit(1);
    }    

    function routerFactory(serverURL, routes) {
        return async (req, resp) => {            
            const 
                {
                    url,
                    method
                } = req,
                {
                    pathname,
                    searchParams
                } = new URL(url, serverURL)
            ;

            //REMOVE IT
            sendMsg.log("info", `method: ${method} path: ${pathname}`);            

            if (method === 'OPTIONS') {
                await routes.get('/')(req, resp, method);
            } else {
                if ( routes.has(pathname) ) {
                    await routes.get(pathname)(req, resp, method, searchParams);
                } else {
                   resp.writeHead(404, "URL not found");
                }
            }            
            resp.end();
        }
    }    
}
