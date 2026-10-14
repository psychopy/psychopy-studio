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
    const downloads = new Set();

    return {
        exists: async (file) => storage?.getItem(file) != null,
        load: async (file) => {
            if (handles.has(file)) {
                return (await handles.get(file).getFile()).text();
            }
            const stored = storage?.getItem(file);
            if (stored != null) {
                return stored;
            }
            // fall back to fetching bundled content (e.g. sample experiments)
            if (typeof windowObject.fetch !== "function") {
                return null;
            }
            // resolve relative paths against the site root
            const url = file.startsWith("/") ? file : `/${file}`;
            try {
                const response = await windowObject.fetch(url);
                if (response.ok) {
                    return await response.text();
                }
            } catch {
                // network errors fall through to null
            }
            return null;
        },
        save: async (file, content) => {
            if (handles.has(file)) {
                const writable = await handles.get(file).createWritable();
                await writable.write(content);
                await writable.close();
                return;
            }
            storage?.setItem(file, content);
            if (downloads.has(file)) {
                const blob = new windowObject.Blob([content], { type: "application/octet-stream" });
                const url = windowObject.URL.createObjectURL(blob);
                const link = windowObject.document.createElement("a");
                link.href = url;
                link.download = file;
                windowObject.document.body.appendChild(link);
                try {
                    link.click();
                } finally {
                    link.remove();
                    windowObject.setTimeout(() => windowObject.URL.revokeObjectURL(url), 1000);
                }
            }
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
            const suggestedName = options.defaultPath?.split(/[\\\/]/).at(-1) || "untitled.psyexp";
            if (typeof windowObject.showSaveFilePicker === "function") {
                try {
                    const handle = await windowObject.showSaveFilePicker({
                        suggestedName,
                        types: browserTypes(options.filters)
                    });
                    if (!handle) {
                        return;
                    }
                    handles.set(handle.name, handle);
                    downloads.delete(handle.name);
                    return handle.name;
                } catch (error) {
                    // In e.g. a google colab iframe env,
                    // filePicker may be blocked due to SecurityError on cross origin.
                    // We can continue and download with the suggestedName instead
                    if (error.name !== "SecurityError") {
                        return;
                    }
                }
            }
            handles.delete(suggestedName);
            downloads.add(suggestedName);
            return suggestedName;
        },
        openExternal: async (url) => windowObject.open(url, "_blank", "noopener,noreferrer")
    };
}