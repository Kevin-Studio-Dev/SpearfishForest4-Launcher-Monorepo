export function getDefaultServerMeta(id, version, options) {
    const servMeta = {
        meta: {
            version: options?.version ?? '1.0.0',
            name: `${id} (Minecraft ${version})`,
            description: `${id} Running Minecraft ${version}`,
            icon: 'How to set the server icon: https://github.com/dscalzi/Nebula#setting-the-server-icon',
            address: 'localhost:25565',
            discord: {
                shortId: '<FILL IN OR REMOVE DISCORD OBJECT>',
                largeImageText: '<FILL IN OR REMOVE DISCORD OBJECT>',
                largeImageKey: '<FILL IN OR REMOVE DISCORD OBJECT>'
            },
            mainServer: false,
            autoconnect: false
        }
    };
    if (options?.forgeVersion) {
        servMeta.meta.description = `${servMeta.meta.description} (Forge v${options.forgeVersion})`;
        servMeta.forge = {
            version: options.forgeVersion
        };
    }
    if (options?.fabricVersion) {
        servMeta.meta.description = `${servMeta.meta.description} (Fabric v${options.fabricVersion})`;
        servMeta.fabric = {
            version: options.fabricVersion
        };
    }
    // Add empty untracked files.
    servMeta.untrackedFiles = [];
    return servMeta;
}
//# sourceMappingURL=ServerMeta.js.map