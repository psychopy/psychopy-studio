export async function getPlatform(navigatorObject = globalThis.navigator) {
    const platform = navigatorObject?.userAgentData?.platform || navigatorObject?.platform || "";

    if (/mac|iphone|ipad|ipod/i.test(platform)) {
        return "darwin";
    }
    if (/win/i.test(platform)) {
        return "win32";
    }
    if (/linux|android|chrome os|cros/i.test(platform)) {
        return "linux";
    }

    return "unknown";
}
