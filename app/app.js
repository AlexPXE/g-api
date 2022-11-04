import { startServer } from './server/server.js';

( ([nodePath, scriptPath, port]) => {
    const sUrl = `http://localhost:${port}`;

    try {
        startServer(sUrl);
    } catch(e) {
        console.log(e.message);
        return;
    }
})(process.argv)