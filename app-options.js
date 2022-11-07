"use strict";

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __direname = path.dirname(__filename);

export const options = {
    serverUrl: 'http://localhost:3000',
    dbPath: path.join(__direname, 'app', 'db', 'db.json'),
    
    ytAPI: {
        scopes: [
            'https://www.googleapis.com/auth/youtube.readonly', 
            'https://www.googleapis.com/auth/youtube.force-ssl'
        ],
        tokenDir: "C:\\Users\\Nav\\.credentials\\",
        tokenFN: "yt.json",
        clientSecretDir: path.join(__direname, '/')
    }
}