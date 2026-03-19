import { electron, python, projects } from '$lib/globals.svelte.js';
import { browseFileOpen, browseFileSave, parsePath } from "$lib/utils/files.js";
import { openIn, showDevTools } from "$lib/utils/views.svelte"
import { current } from './globals.svelte.js';
import { Script } from "$lib/experiment";
import { translate } from "$lib/translation";


/* File */

export function fileNew() {
    // add new tab with blank file
    current.pages.push(
        new Script({
            file: undefined,
            parent: undefined,
            name: "untitled.py",
            stem: "untitled",
            ext: ".py"
        })
    )
    // focus new tab
    current.tab = $state.snapshot(current.pages.length) - 1
}

export async function fileOpen() {
    let file = await browseFileOpen(
        [
            { description: translate("Python Scripts"), accept: {"text/x-python-code": [".py"]} },
            { description: translate("JavaScript Scripts"), accept: {"text/javascript": [".js"]} },
            { description: translate("Data Files"), accept: {"text/csv": [".csv"], "application/json": [".json"]}},
        ],
        current.pages[current.tab]?.file?.parent
    )
    // abort if no file
    if (!file || !file.file) {
        return
    }
    // load from file
    current.openFile(file)
}

export async function revealFolder() {
    if (electron && current.pages[current.tab].file) {
        electron.files.showItemInFolder(current.pages[current.tab].file.file)
    }
}

export async function fileSave() {
    // if no file yet, save as instead
    if (!current.pages[current.tab]?.file?.file) {
        return fileSaveAs()
    }
    // save
    current.pages[current.tab].toFile(current.pages[current.tab].file)    
}

export async function fileSaveAs() {
    // open file browser
    let file = await browseFileSave(
        [
            { description: translate("Python Scripts"), accept: {"text/x-python-code": [".py"]} },
            { description: translate("JavaScript Scripts"), accept: {"text/javascript": [".js"]} },
            { description: translate("Data Files"), accept: {"text/csv": [".csv"], "application/json": [".json"]}},
        ],
        current.pages[current.tab]?.file?.file || "untitled.py"
    )
    // abort if no file
    if (file === undefined) {
        return
    }
    // set file
    current.pages[current.tab].file = file
    // save
    await fileSave()
}

export function quit() {
    if (electron) {
        electron.quit()
    }
}

/* Edit */

export function undo() {
    current.pages[current.tab]?.editor?.getModel()?.undo()
}

export function redo() {
    current.pages[current.tab]?.editor?.getModel()?.undo()
}

export function find() {
    current.pages[current.tab]?.editor?.trigger(
        "find", 
        "editor.actions.findWithArgs", 
        { 
            searchString: ""
        }
    )
}

/* Experiment */

/* Run */

export function togglePiloting() {
    // toggle pilot mode
    if (current.pages[current.tab]) {
        current.pages[current.tab].pilotMode = !current.pages[current.tab].pilotMode
    }
}

export function sendToRunner() {
    openIn(current.pages[current.tab]?.file?.file, "runner")
}

export async function runPython(version) {
    if (!python) {
        return
    }
    if (current.pages[current.tab]) {
        // run script
        await current.pages[current.tab].runPython(version)
    }    

    return true
}

export async function stopPython(version) {
    if (!python) {
        return
    }
    if (current.pages[current.tab]) {
        // run script
        await current.pages[current.tab].stopPython(version)
    }    

    return true
}


export async function runJS() {
    if (!python) {
        return
    }
    if (current.pages[current.tab]) {
        // run script
        await current.pages[current.tab].runJS(false)
    }  
}

/* Views */

export { newWindow, showWindow, showDevTools } from "$lib/utils/views.svelte";


export var shortcuts = {
    new: fileNew,
    open: fileOpen,
    revealFolder: revealFolder,
    save: fileSave,
    saveAs: fileSaveAs,
    close: close,
    quit: quit,
    undo: undo,
    redo: redo,
    togglePiloting: togglePiloting,
    sendToRunner: sendToRunner,
    runPython: runPython,
    stopPython: stopPython,
    runJS: runJS,
    showDevTools: showDevTools
}
