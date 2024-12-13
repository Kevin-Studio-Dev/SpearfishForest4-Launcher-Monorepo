import got from 'got';
import { mkdirs, pathExists } from 'fs-extra/esm';
import { createWriteStream } from 'fs';
import { dirname, join, resolve } from 'path';
import { URL } from 'url';
import { MavenUtil } from '../../util/MavenUtil.js';
import { BaseFileStructure } from '../BaseFileStructure.js';
import { LoggerUtil } from '../../util/LoggerUtil.js';
export class BaseMavenRepo extends BaseFileStructure {
    static logger = LoggerUtil.getLogger('BaseMavenRepo');
    constructor(absoluteRoot, relativeRoot, structRoot) {
        super(absoluteRoot, relativeRoot, structRoot);
    }
    getArtifactById(mavenIdentifier, extension) {
        return resolve(this.containerDirectory, MavenUtil.mavenIdentifierAsPath(mavenIdentifier, extension));
    }
    getArtifactByComponents(group, artifact, version, classifier, extension = 'jar') {
        return resolve(this.containerDirectory, MavenUtil.mavenComponentsAsPath(group, artifact, version, classifier, extension));
    }
    getArtifactUrlByComponents(baseURL, group, artifact, version, classifier, extension = 'jar') {
        return new URL(join(this.relativeRoot, MavenUtil.mavenComponentsAsPath(group, artifact, version, classifier, extension)), baseURL).toString();
    }
    async artifactExists(path) {
        return pathExists(path);
    }
    async downloadArtifactById(url, mavenIdentifier, extension) {
        return this.downloadArtifactBase(url, MavenUtil.mavenIdentifierAsPath(mavenIdentifier, extension));
    }
    async downloadArtifactByComponents(url, group, artifact, version, classifier, extension) {
        return this.downloadArtifactBase(url, MavenUtil.mavenComponentsAsPath(group, artifact, version, classifier, extension));
    }
    async downloadArtifactBase(url, relative) {
        const resolvedURL = new URL(relative, url).toString();
        return this.downloadArtifactDirect(resolvedURL, relative);
    }
    async downloadArtifactDirect(url, path) {
        BaseMavenRepo.logger.debug(`Downloading ${url}..`);
        const request = got.stream.get({ url });
        const localPath = resolve(this.containerDirectory, path);
        await mkdirs(dirname(localPath));
        const writer = createWriteStream(localPath);
        request.pipe(writer);
        return new Promise((resolve, reject) => {
            writer.on('finish', () => {
                BaseMavenRepo.logger.debug(`Completed download of ${url}.`);
                resolve();
            });
            writer.on('error', reject);
        });
    }
    async headArtifactById(url, mavenIdentifier, extension) {
        return this.headArtifactBase(url, MavenUtil.mavenIdentifierAsPath(mavenIdentifier, extension));
    }
    async headArtifactByComponents(url, group, artifact, version, classifier, extension) {
        return this.headArtifactBase(url, MavenUtil.mavenComponentsAsPath(group, artifact, version, classifier, extension));
    }
    async headArtifactBase(url, relative) {
        const resolvedURL = new URL(relative, url).toString();
        try {
            const response = await got.head({
                url: resolvedURL
            });
            return response.statusCode === 200;
        }
        catch (ignored) {
            return false;
        }
    }
}
//# sourceMappingURL=BaseMavenRepo.js.map