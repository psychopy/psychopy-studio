import path from "path-browserify";
import { browseFileOpen, browseFileSave, parsePath } from "$lib/utils/files.js";
import { openIn, showDevTools } from "$lib/utils/views.svelte"
import { Experiment } from "$lib/experiment";
import { Script } from "$lib/experiment/script.svelte";
import { electron } from "$lib/globals.svelte";
import { current } from './globals.svelte.js';
import { translate } from "$lib/translation";


export async function addFile(file, pilotMode=undefined) {
    let item
    // parse file if needed
    if (typeof file === "string") {
        file = parsePath(file)
    }
    // if file is already present, just select it
    if (current.runlist.some(
        item => item.file.file === file.file
    )) {
        current.selection = current.runlist.findIndex(
            item => item.file.file === file.file
        )
        return
    }
    // if given a .psyrun, add all files contained
    if (file.ext === ".psyrun") {
        for (let subfile of await loadPsyrun(file)) {
            addFile(subfile.file, subfile.pilotMode)
        }
        return
    }
    // if given a .psyexp, load as an experiment
    if (file.ext === ".psyexp") {
        item = new Experiment("untitled.psyexp")
        await item.fromFile(file)
    }
    // if given a .py, load as a script
    if (file.ext === ".py") {
        item = new Script(file)
    }
    // quit if filetype isn't allowed
    if (!item) {
        return
    }
    // override pilot mode if requested
    if (pilotMode !== undefined) {
        item.pilotMode = pilotMode
    }
    // add to run list
    current.runlist.push(item)
    // select
    current.selection = current.runlist.length
}

export async function loadPsyrun(file) {
    // load JSON file
    let content = await electron.files.load(file.file)
    // convert paths to file objects with details
    let output = []
    for (let item of JSON.parse(content)) {
        output.push({
            file: parsePath(
                path.join(item.path, item.file)
            ),
            pilotMode: item.pilotMode
        })
    }
    
    return output
}

export function fileNew() {
    // clear current files
    current.runlist.length = 0
    // clear current file info
    current.file = undefined
}

/**
 * Open a file browser to get files.
 * 
 * @param {object} current Current Runner setup (from getContext)
 * @param {boolean} replace If true, then replace existing files with ones selected
 */
export async function fileOpen(replace=false) {
    // work out allowed files
    let allowedFiles
    if (replace) {
        allowedFiles = [
            // only psyrun if we're replacing
            { description: translate("PsychoPy Runner Configurations"), accept: {"application/x-python-code": [".psyrun"]} }
        ]
    } else {
        // psyexp, py and psyrun if we're adding
        allowedFiles = [
            { description: translate("PsychoPy Experiments"), accept: {"application/xml": [".psyexp"]} },
            { description: translate("Python Scripts"), accept: {"application/x-python-code": [".py"]} },
            { description: translate("PsychoPy Runner Configurations"), accept: {"application/x-python-code": [".psyrun"]} }
        ]
    }
    // open file browser
    let file = await browseFileOpen(
        allowedFiles,
        ""
    )
    // abort if no file
    if (file === undefined) {
        return
    }
    // if replacing, clear existing files
    if (replace) {
        fileNew()
        current.file = file
    }
    // add file(s)
    await addFile(file)
}

export async function fileSave() {
    // diverge here based on whether there is a current file...
    if (current.file) {
        // construct serializable object
        let output = current.runlist.map(
            item => $state.snapshot({
                path: item.file.parent,
                file: item.file.name, 
                runMode: item.file.pilotMode ? "pilot" : "run"
            })
        )
        // stringify
        output = JSON.stringify(output, undefined, 4)
        // write file
        if (electron) {
            await electron.files.save(
                $state.snapshot(current.file.file), 
                output
            )
        } else {
            // get file writable from handle
            let file = await current.file.handle.createWritable();
            // write to file
            file.seek(0);
            file.write(output);
            file.close();
        }
    } else {
        return fileSaveAs()
    }
}

export async function fileSaveAs() {
    // open file browser
    let file = await browseFileSave(
        [
            { description: translate("PsychoPy Runner Configurations"), accept: {"application/xml": [".psyrun"]} }
        ],
        current.file?.file || "untitled.psyrun"
    )
    // abort if no file
    if (file === undefined) {
        return
    }
    // set file
    current.file = file
    // save
    await fileSave()

    return current.file
}

export function quit() {
    if (electron) {
        electron.quit()
    }
}

export function togglePiloting() {
    if (current.runlist[current.selection]) {
        current.runlist[current.selection].pilotMode = !current.runlist[current.selection]?.pilotMode
    }
}

export { newWindow, showWindow } from "$lib/utils/views.svelte"


export var shortcuts = {
    new: fileNew,
    open: fileOpen,
    save: fileSave,
    saveAs: fileSaveAs,
    close: close,
    quit: quit,
    togglePiloting: togglePiloting,
    showDevTools: showDevTools
}