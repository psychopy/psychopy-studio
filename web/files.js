export function createFiles(windowObject = globalThis.window) {
    const storage = windowObject?.localStorage;
    return {
        exists: async (file) => storage?.getItem(file) != null,
        load: async (file) => storage?.getItem(file),
        save: async (file, content) => {
            storage?.setItem(file, content);
        },
        openExternal: async (url) => windowObject.open(url, "_blank", "noopener,noreferrer")
    };
}
