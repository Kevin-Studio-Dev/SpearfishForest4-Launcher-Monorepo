import { BaseFileStructure } from '../BaseFileStructure.js';
export class BaseModelStructure extends BaseFileStructure {
    baseUrl;
    resolvedModels;
    constructor(absoluteRoot, relativeRoot, structRoot, baseUrl) {
        super(absoluteRoot, relativeRoot, structRoot);
        this.baseUrl = baseUrl;
    }
}
//# sourceMappingURL=BaseModel.struct.js.map