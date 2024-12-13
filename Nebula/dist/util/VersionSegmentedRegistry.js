import { ForgeModStructure113 } from '../structure/spec_model/module/forgemod/ForgeMod113.struct.js';
import { ForgeModStructure17 } from '../structure/spec_model/module/forgemod/ForgeMod17.struct.js';
import { ForgeGradle3Adapter } from '../resolver/forge/adapter/ForgeGradle3.resolver.js';
import { ForgeGradle2Adapter } from '../resolver/forge/adapter/ForgeGradle2.resolver.js';
export class VersionSegmentedRegistry {
    static FORGE_ADAPTER_IMPL = [
        ForgeGradle2Adapter,
        ForgeGradle3Adapter
    ];
    static FORGEMOD_STRUCT_IMPL = [
        ForgeModStructure17,
        ForgeModStructure113
    ];
    static getForgeResolver(minecraftVersion, forgeVersion, absoluteRoot, relativeRoot, baseURL, discardOutput, invalidateCache) {
        for (const impl of VersionSegmentedRegistry.FORGE_ADAPTER_IMPL) {
            if (impl.isForVersion(minecraftVersion, forgeVersion)) {
                return new impl(absoluteRoot, relativeRoot, baseURL, minecraftVersion, forgeVersion, discardOutput, invalidateCache);
            }
        }
        throw new Error(`No forge resolver found for Minecraft ${minecraftVersion}!`);
    }
    static getForgeModStruct(minecraftVersion, forgeVersion, absoluteRoot, relativeRoot, baseUrl, untrackedFiles) {
        for (const impl of VersionSegmentedRegistry.FORGEMOD_STRUCT_IMPL) {
            if (impl.isForVersion(minecraftVersion, forgeVersion)) {
                return new impl(absoluteRoot, relativeRoot, baseUrl, minecraftVersion, untrackedFiles);
            }
        }
        throw new Error(`No forge mod structure found for Minecraft ${minecraftVersion}!`);
    }
}
//# sourceMappingURL=VersionSegmentedRegistry.js.map