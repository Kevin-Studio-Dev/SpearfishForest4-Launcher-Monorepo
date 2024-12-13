import { createWriteStream } from 'fs';
import { mkdirs } from 'fs-extra/esm';
import got from 'got';
import StreamZip from 'node-stream-zip';
import { join, resolve } from 'path';
import { pipeline } from 'stream/promises';
import { ToggleableNamespace } from '../structure/spec_model/module/ToggleableModule.struct.js';
import { LoggerUtil } from '../util/LoggerUtil.js';
const log = LoggerUtil.getLogger('CurseForgeParser');
export class CurseForgeParser {
    absoluteRoot;
    zipFileName;
    static cfClient = got.extend({
        prefixUrl: 'https://api.curseforge.com/v1',
        responseType: 'json',
        headers: {
            'X-API-KEY': '$2a$10$JL4kTO/N/oXIM6o3uTYC3eLxGrOI4BIAqpX4vAFeIPoXiTtagidkK'
        }
    });
    modpackDir;
    zipPath;
    constructor(absoluteRoot, zipFileName) {
        this.absoluteRoot = absoluteRoot;
        this.zipFileName = zipFileName;
        this.modpackDir = join(absoluteRoot, 'modpacks', 'curseforge');
        this.zipPath = join(this.modpackDir, zipFileName);
    }
    async init() {
        await mkdirs(this.modpackDir);
    }
    async getModpackManifest() {
        const zip = new StreamZip.async({ file: this.zipPath });
        return JSON.parse((await zip.entryData('manifest.json')).toString('utf8'));
    }
    async enrichServer(createServerResult, manifest) {
        log.debug('Enriching server.');
        // Extract overrides
        const zip = new StreamZip.async({ file: this.zipPath });
        try {
            if (manifest.overrides) {
                await zip.extract(manifest.overrides, createServerResult.miscFileContainer);
            }
        }
        finally {
            await zip.close();
        }
        if (createServerResult.modContainer) {
            const requiredPath = resolve(createServerResult.modContainer, ToggleableNamespace.REQUIRED);
            const optionalPath = resolve(createServerResult.modContainer, ToggleableNamespace.OPTIONAL_ON);
            const disallowedFiles = [];
            // Download mods
            for (const file of manifest.files) {
                log.debug(`Processing - Mod: ${file.projectID}, File: ${file.fileID}`);
                const fileInfo = (await CurseForgeParser.cfClient.get(`mods/${file.projectID}/files/${file.fileID}`)).body;
                log.debug(`Downloading ${fileInfo.data.fileName}`);
                let dir;
                const fileNameLower = fileInfo.data.fileName.toLowerCase();
                if (fileNameLower.endsWith('jar')) {
                    dir = file.required ? requiredPath : optionalPath;
                }
                else if (fileNameLower.endsWith('zip')) {
                    // Assume it's a resource pack.
                    dir = join(createServerResult.miscFileContainer, 'resourcepacks');
                    await mkdirs(dir);
                }
                else {
                    dir = createServerResult.miscFileContainer;
                }
                const thirdPartyDisallowed = fileInfo.data.downloadUrl == null;
                if (thirdPartyDisallowed) {
                    log.warn(`${fileInfo.data.fileName} is not available for 3rd-party download through the curseforge API!`);
                    const modInfo = (await CurseForgeParser.cfClient.get(`mods/${file.projectID}`)).body;
                    disallowedFiles.push({
                        name: modInfo.data.name,
                        fileName: fileInfo.data.fileName,
                        url: `https://www.curseforge.com/minecraft/mc-mods/${modInfo.data.slug}/download/${file.fileID}`
                    });
                }
                else {
                    const downloadStream = got.stream(fileInfo.data.downloadUrl);
                    const fileWriterStream = createWriteStream(join(dir, fileInfo.data.fileName));
                    await pipeline(downloadStream, fileWriterStream);
                }
            }
            if (disallowedFiles.length > 0) {
                log.error('============================================');
                log.error('\x1b[41mWARNING\x1b[0m');
                log.error(`${disallowedFiles.length} files declared by this modpack do not permit 3rd-party downloads.`);
                log.error('They MUST be downloaded manually.');
                log.error('The mods and their download urls will be listed below.');
                log.error('============================================');
                for (const file of disallowedFiles) {
                    log.error(`${file.name} (${file.fileName}) - \x1b[32m${file.url}\x1b[0m`);
                }
                log.error('============================================');
                log.error('YOUR MODPACK IS NOT FULLY GENERATED!');
                log.error('MANUAL ACTION REQUIRED! SCROLL UP AND READ THE WARNING!');
                log.error('============================================');
            }
        }
    }
}
//# sourceMappingURL=CurseForgeParser.js.map