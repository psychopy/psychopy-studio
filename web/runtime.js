import { electron } from "./preload.js";
import { createGit } from "./git.js";

const git = createGit();

export function installWebRuntime(windowObject = globalThis.window) {
    if (!windowObject.electron && !windowObject.web) {
        windowObject.web = electron;
    }
    if (!windowObject.git) {
        windowObject.git = git;
    }
    return windowObject.web || windowObject.electron;
}