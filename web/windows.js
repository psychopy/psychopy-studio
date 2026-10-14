export function createWindows() {
    const listeners = new Map();
    return {
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
