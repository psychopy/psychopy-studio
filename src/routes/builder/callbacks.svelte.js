import { electron, python } from '$lib/globals.svelte.js';
import { current } from './globals.svelte.js';

import path from "path-browserify";
import { newWindow, openIn, showDevTools } from "$lib/utils/views.svelte"
import { browseFileOpen, browseFileSave, parsePath } from "$lib/utils/files.js";
import { Routine, HasParams } from "$lib/experiment"
import { prefs } from "$lib/preferences.svelte";
import { translate } from "$lib/translation";


/* File */

export function file_new() {
    newWindow("builder")
}

export async function file_open() {
    // open file browser
    let file = await browseFileOpen(
        [
            { description: translate("PsychoPy Experiments"), accept: {"application/xml": [".psyexp"]} }
        ],
        current.experiment.file?.parent || ""
    )
    // abort if no file
    if (file === undefined) {
        return
    }
    // open
    await openFile(file)
}

export async function openFile(file) {
    // construct an Experiment object from the file
    await current.experiment.fromFile(file);
    // choose current routine
    if (current.experiment.routines) {
        current.routine = Object.values(current.experiment.routines)[0];
    } else {
        current.routine = undefined;
    }
    // mark as no longer modified
    current.experiment.history.clear()
    // show readme if there is one
    let readme = await findReadme()
    if (readme) {
        current.readme.script.fromFile(readme)
        if (prefs.params['alwaysShowReadme'].val) {
            current.readme.shown = true
        }
    }

    console.log(`Loaded experiment '${current.experiment.file.name}':`, current.experiment);
}


export async function revealFolder() {
    if (electron && current.experiment.file) {
        electron.files.showItemInFolder(current.experiment.file.file)
    }
}


export async function file_save() {
    // diverge here based on whether there is a current file...
    if (current.experiment.file.file) {
        current.experiment.toFile(
            $state.snapshot(current.experiment.file)
        )
        // mark as no longer modified
        current.experiment.history.clear()
    } else {
        return file_save_as()
    }
}

export async function file_save_as() {
    // open file browser
    let file = await browseFileSave(
        [
            { description: translate("PsychoPy Experiments"), accept: {"application/xml": [".psyexp"]} }
        ],
        current.experiment.file?.file || "untitled.psyexp"
    )
    // abort if no file
    if (!file || !file.file) {
        return
    }
    // set file
    current.experiment.file = file
    // save
    await file_save()

    return current.experiment.file
}

export function close() {
    window.close()
}

export function quit() {
    if (electron) {
        electron.quit()
    }
}

/* Edit */
export function undo() {
    current.experiment.history.undo();
    // restore focus to tab if possible
    if (current.routine && current.routine.name in current.experiment.routines) {
        current.routine = current.experiment.routines[current.routine.name]
    }
}

export function redo() {
    current.experiment.history.redo();
    // restore focus to tab if possible
    if (current.routine && current.routine.name in current.experiment.routines) {
        current.routine = current.experiment.routines[current.routine.name]
    }
}

/* Experiment */

export async function findReadme() {
    if (electron && current.experiment.file?.parent) {
        // iterate through siblings in folder
        for (let sibling of await electron.files.scandir(current.experiment.file.parent)) {
            // if it's a readme file...
            if (["readme.md", "readme.txt"].includes(sibling.toLowerCase())) {
                // ...return it
                return parsePath(path.join(current.experiment.file.parent, sibling))
                
            }
        }
    }
}

export async function showReadme() {
    // find readme file
    let readme = await findReadme()
    // if there is one, load it
    if (readme) {
        current.readme.script.fromFile(readme)
    } else if (current.experiment.file?.parent) {
        // if we have a folder but no readme, make a readme
        current.readme.script.file = parsePath(path.join(current.experiment.file.parent, "readme.md"))
        current.readme.script.content = ""
        current.readme.script.toFile(current.readme.script.file)
    } else {
        // otherwise, clear
        current.readme.script.file = parsePath("readme.md")
        current.readme.script.content = ""
    }
    // show the readme dlg
    current.readme.shown = true
}

export function copyRoutine(routine=undefined) {
    // use current routine if none given
    if (!routine) {
        routine = current.routine
    }
    // store JSON representation in clipboard
    current.clipboard.set(routine.toJSON())
}

export async function pasteRoutine() {
    let clipboard = await current.clipboard.get()
    // abort if nothing is in the clipboard
    if (!clipboard) {
        return
    }
    // create element from clipboard
    let element
    if (clipboard.tag === "Routine") {
        element = new Routine()
    } else {
        element = new HasParams(clipboard.tag)
    }
    element.fromJSON(clipboard)
    // if element isn't a Routine, abort
    if (![Routine, HasParams].some(cls => element instanceof cls)) {
        return
    }
    // make name valid
    let name = current.experiment.resolveNameConflict(element.name)
    // set name
    if (element instanceof Routine) {
        element.settings.params['name'].val = name
    } else {
        element.params['name'].val = name
    }
    // add to experiment and select
    current.experiment.routines[element.name] = current.routine = element
}

/* Run */


export function togglePiloting() {
    // update history
    current.experiment.history.update(`toggle pilot mode`)
    // toggle pilot mode
    current.experiment.settings.params['runMode'].val = !current.experiment.settings.params['runMode'].val;
}


export async function sendToRunner() {
    await openIn(current.experiment.file.file, "runner")
}


export async function compilePython() {
    // if no file, save as
    if (current.experiment.file === undefined) {
        await file_save_as()
        // if cancelled save, cancel compile
        if (current.experiment.file === undefined) {
            return
        }
    }
    // use experiment object to write
    let target = await current.experiment.writeScript("PsychoPy")
    // open in Coder
    openIn(target, "coder");

    return target
}

export async function compileJS() {
    // if no file, save as
    if (current.experiment.file === undefined) {
        await file_save_as()
        // if cancelled save, cancel compile
        if (current.experiment.file === undefined) {
            return
        }
    }
    // use experiment object to write
    let target = await current.experiment.writeScript("PsychoJS");
    // open in Coder
    openIn(target, "coder");

    return target
}

export async function runPython() {
    // send to runner
    await sendToRunner()
    // run script
    await current.experiment.runPython(true)

    return true
}

export async function stopPython(executable) {
    // cancel running
    await current.experiment.stopPython()
}

export async function runJS() {
    if (!python) {
        return
    }
    // compile to JS
    await compileJS()
    // run
    if (current.experiment.pilotMode) {
        await current.experiment.runJS(true)
    } else {
        await window.open(`https://run.pavlovia.org/${current.project.namespace?.path}/${current.project.path}`)
    }
}

/** Views */
export { newWindow, showWindow, showDevTools } from "$lib/utils/views.svelte"


export var shortcuts = {
    new: file_new,
    open: file_open,
    revealFolder: revealFolder,
    save: file_save,
    saveAs: file_save_as,
    close: close,
    quit: quit,
    undo: undo,
    redo: redo,
    togglePiloting: togglePiloting,
    sendToRunner: sendToRunner,
    compilePython: compilePython,
    runPython: runPython,
    stopPython: stopPython,
    compileJS: compileJS,
    runJS: runJS,
    showDevTools: showDevTools
}
