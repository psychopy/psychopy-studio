export function createFiles(windowObject = globalThis.window) {
    return {
        openExternal: async (url) => windowObject.open(url, "_blank", "noopener,noreferrer")
    };
}
