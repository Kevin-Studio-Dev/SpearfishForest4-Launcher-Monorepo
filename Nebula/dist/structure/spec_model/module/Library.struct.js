import { ModuleStructure } from './Module.struct.js';
import { Type, TypeMetadata } from 'helios-distribution-types';
import { join } from 'path';
import { URL } from 'url';
export class LibraryStructure extends ModuleStructure {
    constructor(absoluteRoot, relativeRoot, baseUrl, minecraftVersion, untrackedFiles) {
        super(absoluteRoot, relativeRoot, 'libraries', baseUrl, minecraftVersion, Type.Library, untrackedFiles, (name) => {
            return name.toLowerCase().endsWith(TypeMetadata[this.type].defaultExtension);
        });
    }
    getLoggerName() {
        return 'LibraryStructure';
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async getModuleId(name, path) {
        const inference = this.attemptCrudeInference(name);
        return this.generateMavenIdentifier(this.getDefaultGroup(), inference.name, inference.version);
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async getModuleName(name, path) {
        const inference = this.attemptCrudeInference(name);
        return inference.name;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async getModuleUrl(name, path, stats) {
        return new URL(join(this.relativeRoot, name), this.baseUrl).toString();
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async getModulePath(name, path, stats) {
        return null;
    }
}
//# sourceMappingURL=Library.struct.js.map