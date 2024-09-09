export function removeDuplicateSlashes(path) {
    return path.replace(/\/{2,}/g, '/');
}