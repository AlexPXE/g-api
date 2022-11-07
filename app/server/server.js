"use strict"

import path from 'path';
import { fileURLToPath } from 'url';
import { EventEmitter } from 'node:events';
import * as fs from 'fs/promises';;
import http from 'http';
import { URL } from 'node:url';
import { loggerBuilder } from '../index.js';


const
    __filename = fileURLToPath( import.meta.url),        
    __direname = path.dirname(__filename)
;

async function startServer(serverURLStr, dbPath = './db/db.json') {
    const msg = loggerBuilder.create("Server");
    
    const
        serverURL = new URL(serverURLStr),
        dbCache = new Map(
            JSON.parse(
                await fs.readFile(dbPath, 'utf8')
            )
        ),

        eventEmitter = new EventEmitter(),

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
                        receivedData = '',
                        message = 'Data fetch error'
                    ;

                    if (method === 'POST') {
                        for await (let chank of req) {
                            receivedData += chank;
                        }

                        const data = JSON.parse(receivedData);

                        dbCache.set(data.name, data);
                        eventEmitter.emit('backup', [...dbCache]);

                        status = 200;
                        message = `Data named '${data.name}' received`;
                    }

                    console.log(message);
                    resp.writeHead(status, {                        
                        'Access-Control-Allow-Origin': '*'
                    });
                }
            ],
            [
                '/restore',
                async (req, resp, method, sParams) => {
                    
                    const data = dbCache.get( sParams.get('name') );

                    if (method === 'GET' && data !== undefined) {
                        resp.writeHead(200, {           
                            'Content-Type': "application/json",
                            'Access-Control-Allow-Origin': '*'
                        });
                        
                        resp.write( JSON.stringify(data) );
                    } else {
                        resp.writeHead(404);
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

    eventEmitter.on('backup', async (data) => {
        await fs.writeFile(
            dbPath,
            JSON.stringify(data, null, 4)
        );
    });
    
    try {
        server.listen(serverURL.port, serverURL.hostname, () => {
            msg.info(`Server started successfully. URL: ${serverURL}`);
        });

    } catch(e) {
        msg.warn("The server has not been started.");
        msg.mute().err(e.message).unmute();
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
            console.log(method, pathname);

            if (method === 'OPTIONS') {
                await routes.get('/')(req, resp, method);
            } else {
                if ( routes.has(pathname) ) {
                    await routes.get(pathname)(req, resp, method, searchParams);
                } else {
                   resp.writeHead(404);
                }
            }
            
            resp.end();
        }
    }    
}

export {
    startServer
}