import { Type } from 'helios-distribution-types';
import { URL } from 'url';
import { ModuleStructure } from './Module.struct.js';
import { readdir, stat } from 'fs/promises';
import { join, resolve, sep } from 'path';
export class MiscFileStructure extends ModuleStructure {
    constructor(absoluteRoot, relativeRoot, baseUrl, minecraftVersion, untrackedFiles) {
        super(absoluteRoot, relativeRoot, 'files', baseUrl, minecraftVersion, Type.File, untrackedFiles);
    }
    getLoggerName() {
        return 'MiscFileStructure';
    }
    async getSpecModel() {
        if (this.resolvedModels == null) {
            this.resolvedModels = await this.recursiveModuleScan(this.containerDirectory);
        }
        return this.resolvedModels;
    }
    async recursiveModuleScan(dir) {
        let acc = [];
        const subdirs = await readdir(dir);
        for (const file of subdirs) {
            const filePath = resolve(dir, file);
            const stats = await stat(filePath);
            if (stats.isDirectory()) {
                acc = acc.concat(await this.recursiveModuleScan(filePath));
            }
            else {
                if (!this.FILE_NAME_BLACKLIST.includes(file)) {
                    acc.push(await this.parseModule(file, filePath, stats));
                }
            }
        }
        return acc;
    }
    async getModuleId(name, path) {
        return name;
    }
    async getModuleName(name, path) {
        return name;
    }
    async getModuleUrl(name, path, stats) {
        return new URL(join(this.relativeRoot, ...path.substr(this.containerDirectory.length + 1).split(sep)), this.baseUrl).toString();
    }
    async getModulePath(name, path, stats) {
        return path.substr(this.containerDirectory.length + 1).replace(/\\/g, '/');
    }
}
//# sourceMappingURL=File.struct.js.map