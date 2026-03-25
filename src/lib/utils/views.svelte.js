import { electron } from "$lib/globals.svelte";
import { resolve } from "$app/paths"


/**
 * Open a new window (or a new tab in browser mode)
 * 
 * @param {string} target URL to target for this window (will be appended to the root URL)
 */
export function newWindow(target) {
    if (electron) {
        return electron.windows.new(target);
    } else {
        return window.open(resolve(`/${target}`))
    }
}


/**
 * Open a given file in a window matching the target URL (only available in electron)
 * 
 * @param {string} file File to open
 * @param {string} target Window to open in
 */
export async function openIn(file, target) {
    if (electron) {
        // get windows matching target
        let windows = await electron.windows.get(target);
        // either get first ID, or make a new window and use its ID
        let id;
        if (windows.length) {
            id = windows[0]
        } else {
            id = await electron.windows.new(target)
        }
        // send request to window to open file
        await electron.windows.send(id, "fileOpen", $state.snapshot(file))
        // focus window
        await electron.windows.focus(id)
    }
}

/**
 * Show the first of a particular window, or open one if none are open
 */
export async function showWindow(target, focus=true) {
    if (electron) {
        // get windows matching target
        let windows = await electron.windows.get(target);
        // either get first ID, or make a new window and use its ID
        let id;
        if (windows.length) {
            id = windows[0]
        } else {
            id = await electron.windows.new(target)
        }
        // focus window
        if (focus) {
            await electron.windows.focus(id)
        }
    }
}

/**
 * Show the devtools panel in the current window
 */
export function showDevTools() {
    if (electron) {
        electron.windows.devtools()
    }   
}