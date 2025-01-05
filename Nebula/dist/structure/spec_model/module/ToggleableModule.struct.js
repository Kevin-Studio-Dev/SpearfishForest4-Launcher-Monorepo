import { ModuleStructure } from './Module.struct.js';
import { mkdirs } from 'fs-extra/esm';
import { resolve } from 'path';
export var ToggleableNamespace;
(function (ToggleableNamespace) {
    ToggleableNamespace["REQUIRED"] = "required";
    ToggleableNamespace["OPTIONAL_ON"] = "optionalon";
    ToggleableNamespace["OPTIONAL_OFF"] = "optionaloff";
})(ToggleableNamespace || (ToggleableNamespace = {}));
export class ToggleableModuleStructure extends ModuleStructure {
    activeNamespace;
    constructor(absoluteRoot, relativeRoot, structRoot, baseUrl, minecraftVersion, type, untrackedFiles, filter) {
        super(absoluteRoot, relativeRoot, structRoot, baseUrl, minecraftVersion, type, untrackedFiles, filter);
    }
    async init() {
        await super.init();
        for (const namespace of Object.values(ToggleableNamespace)) {
            await mkdirs(resolve(this.containerDirectory, namespace));
        }
    }
    async getSpecModel() {
        if (this.resolvedModels == null) {
            const moduleCandidates = [];
            for (const value of Object.values(ToggleableNamespace)) {
                moduleCandidates.push(...(await super._doModuleDiscovery(resolve(this.containerDirectory, value))).map(val => ({ ...val, namespace: value })));
            }
            this.resolvedModels = await this._doModuleRetrieval(moduleCandidates, {
                preProcess: (candidate) => {
                    this.activeNamespace = candidate.namespace;
                },
                postProcess: (module) => {
                    this.getNamespaceMapper(this.activeNamespace)(module);
                }
            });
            // Cleanup
            this.activeNamespace = undefined;
        }
        return this.resolvedModels;
    }
    getActiveNamespace() {
        return this.activeNamespace || '';
    }
    getNamespaceMapper(namespace) {
        switch (namespace) {
            case ToggleableNamespace.REQUIRED:
                return () => { };
            case ToggleableNamespace.OPTIONAL_ON:
                return (x) => { x.required = { value: false }; };
            case ToggleableNamespace.OPTIONAL_OFF:
                return (x) => { x.required = { value: false, def: false }; };
        }
    }
}
//# sourceMappingURL=ToggleableModule.struct.js.map