import { startServer } from '/index.js';
import { ytBackup } from './index.js';
import { options } from './options.js';

( ([nodePath, scriptPath, port = options.server.port]) => {
    const sUrl = `http://localhost:${port}`;

    try {
        startServer(sUrl);
    } catch(e) {
        console.log(e.message);
        return;
    }
})(process.argv)