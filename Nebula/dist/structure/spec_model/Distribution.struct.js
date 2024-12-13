import { mkdirs, pathExists } from 'fs-extra/esm';
import { readFile, writeFile } from 'fs/promises';
import { ServerStructure } from './Server.struct.js';
import { join, resolve } from 'path';
import { getDefaultDistroMeta } from '../../model/nebula/DistroMeta.js';
import { addSchemaToObject, SchemaTypes } from '../../util/SchemaUtil.js';
import { LoggerUtil } from '../../util/LoggerUtil.js';
const logger = LoggerUtil.getLogger('DistributionStructure');
export class DistributionStructure {
    absoluteRoot;
    baseUrl;
    DISTRO_META_FILE = 'distrometa.json';
    serverStruct;
    metaPath;
    constructor(absoluteRoot, baseUrl, discardOutput, invalidateCache) {
        this.absoluteRoot = absoluteRoot;
        this.baseUrl = baseUrl;
        this.serverStruct = new ServerStructure(this.absoluteRoot, this.baseUrl, discardOutput, invalidateCache);
        this.metaPath = join(this.absoluteRoot, 'meta');
    }
    async init() {
        await mkdirs(this.absoluteRoot);
        await mkdirs(this.metaPath);
        const distroMetaFile = resolve(this.metaPath, this.DISTRO_META_FILE);
        if (await pathExists(distroMetaFile)) {
            logger.warn(`Distro Meta file already exists at ${distroMetaFile}!`);
            logger.warn('If you wish to regenerate this file, you must delete the existing one!');
        }
        else {
            const distroMeta = addSchemaToObject(getDefaultDistroMeta(), SchemaTypes.DistroMetaSchema, this.absoluteRoot);
            await writeFile(distroMetaFile, JSON.stringify(distroMeta, null, 2));
        }
        await this.serverStruct.init();
    }
    async getSpecModel() {
        const distroMeta = JSON.parse(await readFile(resolve(this.metaPath, this.DISTRO_META_FILE), 'utf-8'));
        return {
            version: '1.0.0',
            rss: distroMeta.meta.rss,
            ...(distroMeta.meta.discord ? { discord: distroMeta.meta.discord } : {}),
            servers: await this.serverStruct.getSpecModel()
        };
    }
}
//# sourceMappingURL=Distribution.struct.js.map