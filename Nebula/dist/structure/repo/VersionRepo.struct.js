import { join } from 'path';
import { URL } from 'url';
import { BaseFileStructure } from '../BaseFileStructure.js';
export class VersionRepoStructure extends BaseFileStructure {
    name;
    constructor(absoluteRoot, relativeRoot, name) {
        super(absoluteRoot, relativeRoot, 'versions');
        this.name = name;
    }
    getLoggerName() {
        return 'VersionRepoStructure';
    }
    getFileName(minecraftVersion, loaderVersion) {
        return `${minecraftVersion}-${this.name}-${loaderVersion}`;
    }
    getVersionManifest(minecraftVersion, loaderVersion) {
        const fileName = this.getFileName(minecraftVersion, loaderVersion);
        return join(this.containerDirectory, fileName, `${fileName}.json`);
    }
    getVersionManifestURL(url, minecraftVersion, loaderVersion) {
        const fileName = this.getFileName(minecraftVersion, loaderVersion);
        return new URL(join(this.relativeRoot, fileName, `${fileName}.json`), url).toString();
    }
}
//# sourceMappingURL=VersionRepo.struct.js.map