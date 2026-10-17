function browserTypes(filters = []) {
  return filters
    .filter(({ extensions }) => !extensions.includes("*"))
    .map(({ name, extensions }) => ({
        description: name,
        accept: {
            "application/octet-stream": extensions.map((extension) => `.${extension}`)
        }
    }));
}

export function createFiles(windowObject = globalThis.window) {
    const storage = windowObject?.localStorage;
    const handles = new Map();

    return {
        exists: async (file) => storage?.getItem(file) != null,
        load: async (file) => {
            if (handles.has(file)) {
                return (await handles.get(file).getFile()).text();
            }
            return storage?.getItem(file);
        },
        save: async (file, content) => {
            if (handles.has(file)) {
                const writable = await handles.get(file).createWritable();
                await writable.write(content);
                await writable.close();
                return;
            }
            storage?.setItem(file, content);
        },
        openDialog: async (options = {}) => {
            const selected = await windowObject.showOpenFilePicker({
                multiple: options.properties?.includes("multiSelections") || false,
                types: browserTypes(options.filters)
            }).catch(() => undefined);
            if (!selected) {
                return;
            }
            for (const handle of selected) {
                handles.set(handle.name, handle);
            }
            return selected.map((handle) => handle.name);
        },
        saveDialog: async (options = {}) => {
            const handle = await windowObject.showSaveFilePicker({
                suggestedName: options.defaultPath?.split(/[\\/]/).at(-1),
                types: browserTypes(options.filters)
            }).catch(() => undefined);
            if (!handle) {
                return;
            }
            handles.set(handle.name, handle);
            return handle.name;
        },
        openExternal: async (url) => windowObject.open(url, "_blank", "noopener,noreferrer")
    };
}