import { JavaUtil } from './JavaUtil.js';
import { spawn } from 'child_process';
import { LoggerUtil } from '../LoggerUtil.js';
export class JarExecutor {
    logger;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    stdoutListeners = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    stderrListeners = [];
    onCloseListeners = [];
    lastExecutionResult;
    constructor(loggerName) {
        this.logger = LoggerUtil.getLogger(loggerName);
    }
    executeJar(vmOptions, ...args) {
        this.lastExecutionResult = undefined;
        return new Promise((resolve, reject) => {
            const child = spawn(JavaUtil.getJavaExecutable(), [
                ...vmOptions,
                '-jar',
                this.getJarPath(),
                ...args
            ]);
            child.stdout.on('data', (data) => this.logger.info(data.toString('utf8').trim()));
            this.stdoutListeners.forEach(l => child.stdout.on('data', l));
            child.stderr.on('data', (data) => this.logger.error(data.toString('utf8').trim()));
            this.stderrListeners.forEach(l => child.stderr.on('data', l));
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            child.on('close', async (code) => {
                this.logger.info('Exited with code', code);
                for (const l of this.onCloseListeners) {
                    await l(code);
                }
                resolve(this.lastExecutionResult);
            });
            child.on('error', (err) => {
                this.logger.info('Error during process execution', err);
                reject(err);
            });
        });
    }
}
//# sourceMappingURL=JarExecutor.js.map