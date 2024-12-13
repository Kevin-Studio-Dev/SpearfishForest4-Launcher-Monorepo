import { BaseMavenRepo } from './BaseMavenRepo.js';
export class LibRepoStructure extends BaseMavenRepo {
    static MINECRAFT_GROUP = 'net.minecraft';
    static MINECRAFT_CLIENT_ARTIFACT = 'client';
    static FORGE_GROUP = 'net.minecraftforge';
    static FORGE_ARTIFACT = 'forge';
    static FMLCORE_ARTIFACT = 'fmlcore';
    static JAVAFMLLANGUAGE_ARTIFACT = 'javafmllanguage';
    static MCLANGUAGE_ARTIFACT = 'mclanguage';
    static LOWCODELANGUAGE_ARTIFACT = 'lowcodelanguage';
    constructor(absoluteRoot, relativeRoot) {
        super(absoluteRoot, relativeRoot, 'lib');
    }
    getLoggerName() {
        return 'LibRepoStructure';
    }
    getLocalForge(version, classifier) {
        return this.getArtifactByComponents(LibRepoStructure.FORGE_GROUP, LibRepoStructure.FORGE_ARTIFACT, version, classifier, 'jar');
    }
}
//# sourceMappingURL=LibRepo.struct.js.map