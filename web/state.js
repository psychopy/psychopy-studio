export function createState(frame = {}) {
    return {
        updateFrame: async (details) => {
            Object.assign(frame, details);
        }
    };
}
