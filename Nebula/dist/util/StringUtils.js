export function capitalize(str) {
    if (!str) {
        return str;
    }
    return str.charAt(0).toUpperCase() + str.slice(1);
}
export function isValidUrl(candidate) {
    try {
        new URL(candidate);
        return true;
    }
    catch (err) {
        return false;
    }
}
//# sourceMappingURL=StringUtils.js.map