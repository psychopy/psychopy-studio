export function createClipboard() {
    let value;

    return {
        get: async () => value,
        set: async (nextValue) => {
            value = nextValue;
        }
    }
}
