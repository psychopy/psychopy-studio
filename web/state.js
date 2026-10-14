export function createState(frame = {}) {
    const profiles = {};
    return {
        getProfiles: () => profiles,
        setProfiles: async (key, value) => {
            profiles[key] = value;
        },
        updateFrame: async (details) => {
            Object.assign(frame, details);
        }
    };
}
