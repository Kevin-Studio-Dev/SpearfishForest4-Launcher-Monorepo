import { mkdirs, pathExists, remove } from 'fs-extra/esm';
import { writeFile } from 'fs/promises';
import { join, resolve } from 'path';
import { createGenerator } from 'ts-json-schema-generator';
import { URL, fileURLToPath } from 'url';
import { LoggerUtil } from './LoggerUtil.js';
const logger = LoggerUtil.getLogger('SchemaUtil');
const __filename = fileURLToPath(import.meta.url);
const __dirname = fileURLToPath(new URL('.', import.meta.url));
export var SchemaTypes;
(function (SchemaTypes) {
    SchemaTypes["DistroMetaSchema"] = "DistroMetaSchema";
    SchemaTypes["ServerMetaSchema"] = "ServerMetaSchema";
})(SchemaTypes || (SchemaTypes = {}));
function getSchemaFileName(typeName) {
    return `${typeName}.schema.json`;
}
function getSchemaDirectory(absoluteRoot) {
    return resolve(absoluteRoot, 'schemas');
}
function getSchemaLocation(typeName, absoluteRoot) {
    return resolve(getSchemaDirectory(absoluteRoot), getSchemaFileName(typeName));
}
export function addSchemaToObject(obj, typeName, absoluteRoot) {
    return {
        $schema: new URL(`file:${getSchemaLocation(typeName, absoluteRoot)}`).href,
        ...obj
    };
}
export async function generateSchemas(absoluteRoot) {
    const selfPath = __filename.replace('dist', 'src').replace('.js', '.ts');
    const schemaDir = getSchemaDirectory(absoluteRoot);
    if (await pathExists(schemaDir)) {
        await remove(schemaDir);
    }
    await mkdirs(schemaDir);
    for (const typeName of Object.values(SchemaTypes)) {
        logger.info(`Generating schema for ${typeName}`);
        const schema = createGenerator({
            tsconfig: join(__dirname, '..', '..', 'tsconfig.json'),
            path: selfPath,
            type: typeName
        }).createSchema(typeName);
        const schemaString = JSON.stringify(schema);
        const schemaLoc = getSchemaLocation(typeName, absoluteRoot);
        await writeFile(schemaLoc, schemaString);
        logger.info(`Schema for ${typeName} saved to ${schemaLoc}`);
    }
}
//# sourceMappingURL=SchemaUtil.js.map