import { mkdirs } from 'fs-extra/esm';
import { join, resolve } from 'path';
import { LoggerUtil } from '../util/LoggerUtil.js';
export class BaseFileStructure {
    absoluteRoot;
    relativeRoot;
    structRoot;
    logger;
    containerDirectory;
    constructor(absoluteRoot, relativeRoot, structRoot) {
        this.absoluteRoot = absoluteRoot;
        this.relativeRoot = relativeRoot;
        this.structRoot = structRoot;
        this.relativeRoot = join(relativeRoot, structRoot);
        this.containerDirectory = resolve(absoluteRoot, structRoot);
        this.logger = LoggerUtil.getLogger(this.getLoggerName());
    }
    async init() {
        await mkdirs(this.containerDirectory);
    }
    getContainerDirectory() {
        return this.containerDirectory;
    }
}
//# sourceMappingURL=BaseFileStructure.js.map