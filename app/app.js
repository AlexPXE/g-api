import { runner } from './exec/exec.js';

( async ([nodePath, scriptPath, command, ...options]) => {
    await runner.run(command, options);
})(process.argv)