export function createWindows(
    windowObject = globalThis.window,
    documentObject = globalThis.document
) {
    const listeners = new Map();
    return {
        new: async (target) => {
            const url = new URL(target.replace(/^\//, ""), documentObject.baseURI);
            if (windowObject.self !== windowObject.top) {
                windowObject.location.assign(url);
                return windowObject;
            }
            return windowObject.open(url, "_blank");
        },
        listen: (tag, listener) => {
            if (!listeners.has(tag)) {
                listeners.set(tag, new Set());
            }
            listeners.get(tag).add(listener);
        },
        emit: (tag, data) => {
            for (const listener of listeners.get(tag) || []) {
                listener(undefined, data);
            }
        }
    };
}
