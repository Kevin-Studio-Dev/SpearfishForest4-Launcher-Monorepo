import { minimatch } from 'minimatch';
import { createHash } from 'crypto';
import { pathExists } from 'fs-extra/esm';
import { lstat, readdir, readFile } from 'fs/promises';
import { TypeMetadata } from 'helios-distribution-types';
import { resolve } from 'path';
import { BaseModelStructure } from '../BaseModel.struct.js';
import { ClaritasWrapper } from '../../../util/java/ClaritasWrapper.js';
export class ModuleStructure extends BaseModelStructure {
    minecraftVersion;
    type;
    filter;
    crudeRegex = /(.+?)-(.+).[jJ][aA][rR]/;
    DEFAULT_VERSION = '0.0.0';
    FILE_NAME_BLACKLIST = [
        '.gitkeep'
    ];
    untrackedFilePatterns; // List of glob patterns. 
    claritasResult;
    constructor(absoluteRoot, relativeRoot, structRoot, baseUrl, minecraftVersion, type, untrackedFiles, filter) {
        super(absoluteRoot, relativeRoot, structRoot, baseUrl);
        this.minecraftVersion = minecraftVersion;
        this.type = type;
        this.filter = filter;
        this.untrackedFilePatterns = this.determineUntrackedFiles(structRoot, untrackedFiles);
    }
    async getSpecModel() {
        if (this.resolvedModels == null) {
            this.resolvedModels = await this._doModuleRetrieval(await this._doModuleDiscovery(this.containerDirectory));
        }
        return this.resolvedModels;
    }
    getDefaultGroup() {
        return `generated.${this.type.toLowerCase()}`;
    }
    generateMavenIdentifier(group, id, version) {
        return `${group}:${id}:${version}@${TypeMetadata[this.type].defaultExtension}`;
    }
    attemptCrudeInference(name) {
        const result = this.crudeRegex.exec(name);
        if (result != null) {
            return {
                name: result[1],
                version: result[2]
            };
        }
        else {
            return {
                name: name.substring(0, name.lastIndexOf('.')),
                version: this.DEFAULT_VERSION
            };
        }
    }
    getClaritasGroup(path) {
        return this.claritasResult[path]?.group || this.getDefaultGroup();
    }
    getClaritasExceptions() {
        return [];
    }
    getClaritasType() {
        return null;
    }
    async parseModule(file, filePath, stats) {
        const artifact = {
            size: stats.size,
            url: await this.getModuleUrl(file, filePath, stats)
        };
        const relativeToContainer = filePath.substr(this.containerDirectory.length + 1);
        const untrackedByPattern = this.isFileUntracked(relativeToContainer);
        if (!untrackedByPattern) {
            const buf = await readFile(filePath);
            artifact.MD5 = createHash('md5').update(buf).digest('hex');
        }
        else {
            this.logger.debug(`File ${relativeToContainer} is untracked. Matching pattern: ${untrackedByPattern}`);
        }
        const mdl = {
            id: await this.getModuleId(file, filePath),
            name: await this.getModuleName(file, filePath),
            type: this.type,
            artifact
        };
        const pth = await this.getModulePath(file, filePath, stats);
        if (pth) {
            mdl.artifact.path = pth;
        }
        return mdl;
    }
    async _doModuleDiscovery(scanDirectory) {
        const moduleCandidates = [];
        if (await pathExists(scanDirectory)) {
            const files = await readdir(scanDirectory);
            for (const file of files) {
                const filePath = resolve(scanDirectory, file);
                const stats = await lstat(filePath);
                if (stats.isFile()) {
                    if (!this.FILE_NAME_BLACKLIST.includes(file)) {
                        if (this.filter == null || this.filter(file, filePath, stats)) {
                            moduleCandidates.push({ file, filePath, stats });
                        }
                    }
                }
            }
        }
        return moduleCandidates;
    }
    async invokeClaritas(moduleCandidates) {
        if (this.getClaritasType() != null) {
            const claritasExecutor = new ClaritasWrapper(this.absoluteRoot);
            let claritasCandidates = moduleCandidates;
            const exceptionCandidates = [];
            for (const exception of this.getClaritasExceptions()) {
                const exceptionCandidate = moduleCandidates.find((value) => value.file.toLowerCase().includes(exception.exceptionName));
                if (exceptionCandidate != null) {
                    exceptionCandidates.push([exceptionCandidate, exception]);
                    claritasCandidates = claritasCandidates.filter((value) => !value.file.toLowerCase().includes(exception.exceptionName));
                }
            }
            this.claritasResult = await claritasExecutor.execute(this.getClaritasType(), this.minecraftVersion, claritasCandidates.map(entry => entry.filePath));
            if (this.claritasResult == null) {
                this.logger.error('Failed to process Claritas result!');
            }
            else {
                for (const [candidate, exception] of exceptionCandidates) {
                    this.claritasResult[candidate.filePath] = exception.proxyMetadata;
                }
            }
        }
    }
    async _doModuleRetrieval(moduleCandidates, options) {
        const accumulator = [];
        if (moduleCandidates.length > 0) {
            // Invoke Claritas and attach result to class.
            await this.invokeClaritas(moduleCandidates);
            // Process Modules
            for (const candidate of moduleCandidates) {
                options?.preProcess?.(candidate);
                const mdl = await this.parseModule(candidate.file, candidate.filePath, candidate.stats);
                options?.postProcess?.(mdl);
                accumulator.push(mdl);
            }
        }
        return accumulator;
    }
    determineUntrackedFiles(targetStructRoot, untrackedFileOptions) {
        if (untrackedFileOptions) {
            return untrackedFileOptions
                .filter(x => x.appliesTo.includes(targetStructRoot))
                .reduce((acc, cur) => acc.concat(cur.patterns), []);
        }
        return [];
    }
    // Will return the matching pattern, undefined if no match.
    isFileUntracked(pathRelativeToContainer) {
        return this.untrackedFilePatterns.find(pattern => minimatch(pathRelativeToContainer, pattern));
    }
}
//# sourceMappingURL=Module.struct.js.map