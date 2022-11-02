"use strict"

import path from 'path';
import { fileURLToPath } from 'url';
import { EventEmitter } from 'node:events';
import * as fs from 'fs/promises';;
import http from 'http';
import { URL } from 'node:url';


const
    __filename = fileURLToPath( import.meta.url),        
    __direname = path.dirname(__filename)
;

async function startServer(serverURLStr) {
    
    const
        serverURL = new URL(serverURLStr),
        dbCache = new Map(
            JSON.parse(
                await fs.readFile('./app/db/db.json', 'utf8')
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
            path.join(__direname, 'data.json'),
            JSON.stringify(data, null, 4)
        );
    });
    
    server.listen(serverURL.port, serverURL.hostname, () => {
        console.log(`Server started successfully. URL: ${serverURL}`);
    });

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