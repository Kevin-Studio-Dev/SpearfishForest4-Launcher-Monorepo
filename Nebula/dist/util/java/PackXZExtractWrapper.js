import { join } from 'path';
import { JarExecutor } from './JarExecutor.js';
export class PackXZExtractWrapper extends JarExecutor {
    constructor() {
        super('PackXZExtract');
    }
    getJarPath() {
        return join(process.cwd(), 'libraries', 'java', 'PackXZExtract.jar');
    }
    execute(command, paths) {
        return super.executeJar([], command, paths.join(','));
    }
    extractUnpack(paths) {
        return this.execute('-packxz', paths);
    }
    extract(paths) {
        return this.execute('-xz', paths);
    }
    unpack(paths) {
        return this.execute('-pack', paths);
    }
}
//# sourceMappingURL=PackXZExtractWrapper.js.map