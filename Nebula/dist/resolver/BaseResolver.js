import { createHash } from 'crypto';
export class BaseResolver {
    absoluteRoot;
    relativeRoot;
    baseUrl;
    constructor(absoluteRoot, relativeRoot, baseUrl) {
        this.absoluteRoot = absoluteRoot;
        this.relativeRoot = relativeRoot;
        this.baseUrl = baseUrl;
    }
    generateArtifact(buf, stats, url) {
        return {
            size: stats.size,
            MD5: createHash('md5').update(buf).digest('hex'),
            url
        };
    }
}
//# sourceMappingURL=BaseResolver.js.map