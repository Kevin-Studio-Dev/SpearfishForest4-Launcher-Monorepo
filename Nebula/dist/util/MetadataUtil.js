export class MetadataUtil {
    static completeGroupInference(partial, id) {
        const bits = partial.split('.');
        let isBadTerm = true;
        while (isBadTerm && bits.length > 2) {
            const term = bits[bits.length - 1];
            if (term !== id) {
                isBadTerm = false;
            }
            else {
                bits.pop();
            }
        }
        return bits.join('.');
    }
}
//# sourceMappingURL=MetadataUtil.js.map