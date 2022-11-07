import { exec } from './exec/exec.js';

( async ([nodePath, scriptPath, command, ...options]) => {
    await exec.execute(command, options);
})(process.argv)