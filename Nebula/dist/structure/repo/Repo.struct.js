import { mkdirs } from 'fs-extra/esm';
import { join } from 'path';
import { BaseFileStructure } from '../BaseFileStructure.js';
import { LibRepoStructure } from './LibRepo.struct.js';
import { VersionRepoStructure } from './VersionRepo.struct.js';
export class RepoStructure extends BaseFileStructure {
    libRepoStruct;
    versionRepoStruct;
    constructor(absoluteRoot, relativeRoot, name) {
        super(absoluteRoot, relativeRoot, 'repo');
        this.libRepoStruct = new LibRepoStructure(this.containerDirectory, this.relativeRoot);
        this.versionRepoStruct = new VersionRepoStructure(this.containerDirectory, this.relativeRoot, name);
    }
    getLoggerName() {
        return 'RepoStructure';
    }
    async init() {
        await super.init();
        await this.libRepoStruct.init();
        await this.versionRepoStruct.init();
        await mkdirs(this.getCacheDirectory());
    }
    getLibRepoStruct() {
        return this.libRepoStruct;
    }
    getVersionRepoStruct() {
        return this.versionRepoStruct;
    }
    getTempDirectory() {
        return join(this.absoluteRoot, 'temp');
    }
    getWorkDirectory() {
        return join(this.absoluteRoot, 'work');
    }
    getCacheDirectory() {
        return join(this.absoluteRoot, 'cache');
    }
    getForgeCacheDirectory(artifactVersion) {
        return join(this.getCacheDirectory(), 'forge', artifactVersion);
    }
}
//# sourceMappingURL=Repo.struct.js.map