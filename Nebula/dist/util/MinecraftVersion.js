export class MinecraftVersion {
    static MINECRAFT_VERSION_REGEX = /(\d+).(\d+).?(\d+)?/;
    major;
    minor;
    revision;
    constructor(version) {
        const res = MinecraftVersion.MINECRAFT_VERSION_REGEX.exec(version);
        if (res != null) {
            this.major = Number(res[1]);
            this.minor = Number(res[2]);
            this.revision = res[3] != null ? Number(res[3]) : undefined;
        }
        else {
            throw new Error(`${version} is not a valid minecraft version!`);
        }
    }
    static isMinecraftVersion(version) {
        return MinecraftVersion.MINECRAFT_VERSION_REGEX.test(version);
    }
    getMajor() { return this.major; }
    getMinor() { return this.minor; }
    getRevision() { return this.revision; }
    toString() { return `${this.major}.${this.minor}${this.revision != null ? '.' + this.revision : ''}`; }
}
//# sourceMappingURL=MinecraftVersion.js.map