import { electron, python } from '$lib/globals.svelte.js';
import { current } from './globals.svelte.js';

import path from "path-browserify";
import { newWindow, openIn, showDevTools, focusNextPanel, showBuilder, showCoder, showRunner } from "$lib/utils/views.svelte"
import { browseFileOpen, browseFileSave, parsePath } from "$lib/utils/files.js";
import { Routine, StandaloneRoutine, Component, HasParams } from "$lib/experiment"
import { prefs } from "$lib/preferences.svelte";
import { translate } from "$lib/translation";
import { Callback } from "$lib/utils/shortcuts";
import { resetPrefs, openUserFolder, reinstallPython, gotoHomepage, gotoDocumentation, gotoForum } from "$lib/utils/callbacks.js"


/* File */

function file_new() {
    newWindow("builder")
}

async function file_open() {
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

async function openFile(file) {
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


async function revealFolder() {
    if (electron && current.experiment.file) {
        electron.files.showItemInFolder(current.experiment.file.file)
    }
}


export async function file_save() {
    // can't save while a file is still loading
    if (current.experiment.loading) {
        return
    }
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
    // can't save while a file is still loading
    if (current.experiment.loading) {
        return
    }
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

function close() {
    window.close()
}

function quit() {
    if (electron) {
        electron.quit()
    }
}

/* Edit */
function undo() {
    current.experiment.history.undo();
    // restore focus to tab if possible
    if (current.routine && current.routine.name in current.experiment.routines) {
        current.routine = current.experiment.routines[current.routine.name]
    }
}

function redo() {
    current.experiment.history.redo();
    // restore focus to tab if possible
    if (current.routine && current.routine.name in current.experiment.routines) {
        current.routine = current.experiment.routines[current.routine.name]
    }
}

/* Experiment */

async function findReadme() {
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

async function showReadme() {
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

function copyRoutine(routine=undefined) {
    // use current routine if none given
    if (!routine) {
        routine = current.routine
    }
    // store JSON representation in clipboard
    current.clipboard.set(routine.toJSON())
}

async function pasteRoutine() {
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
        element = new StandaloneRoutine(clipboard.tag)
    }
    element.fromJSON(clipboard)
    // if element isn't a Routine, abort
    if (![Routine, HasParams].some(cls => element instanceof cls)) {
        return
    }
    // add to experiment
    current.experiment.addRoutine(element)
    // select
    current.routine = element

    return element
}

/**
 * Copy the given Component to the app's (inter-window) clipboard
 * 
 * @param {HasParams} component Component to copy
 */
function copyComponent(component) {
    // store JSON representation in clipboard
    current.clipboard.set(component.toJSON())
}

/**
 * Paste a Component from the (inter-window) clipboard into the given Routine at the given position
 * 
 * @param {Routine} routine Routine to paste into
 * @param {integer} index Index in the Routine to insert the Component
 */
async function pasteComponent(routine, index) {
    let clipboard = await current.clipboard.get()
    // abort if nothing is in the clipboard
    if (!clipboard) {
        return
    }
    // create element from clipboard
    let element = new Component(clipboard.tag)
    element.fromJSON(clipboard)
    // make name valid
    let name = current.experiment.resolveNameConflict(element.name)
    // set name
    if (element.params['name']) {
        element.params['name'].val = name
    }
    // add to Routine
    routine.insertComponent(element, index)
}

/* Run */


export async function togglePiloting() {
    // wait for settings
    await current.experiment.ready
    // update history
    current.experiment.history.update(`toggle pilot mode`)
    // toggle pilot mode
    current.experiment.settings.params['runMode'].val = !current.experiment.settings.params['runMode'].val;
}


async function sendToRunner() {
    await openIn(current.experiment.file.file, "runner")
}

/**
 * Compile experiment to a JS file
 * 
 * @param {boolean} focus Focus Coder afterwards
 */
async function compilePython(focus=true) {
    // if no file, save as
    if (current.experiment.file?.file === undefined) {
        await file_save_as()
        // if cancelled save, cancel compile
        if (current.experiment.file?.file === undefined) {
            return
        }
    }
    // use experiment object to write
    let target = await current.experiment.writeScript("PsychoPy")
    // open in Coder
    openIn(target, "coder", focus);

    return target
}

/**
 * Compile experiment to a JS file
 * 
 * @param {boolean} focus Focus Coder afterwards
 */
async function compileJS(focus=true) {
    // if no file, save as
    if (current.experiment.file?.file === undefined) {
        await file_save_as()
        // if cancelled save, cancel compile
        if (current.experiment.file?.file === undefined) {
            return
        }
    }
    // use experiment object to write
    let target = await current.experiment.writeScript("PsychoJS");
    // open in Coder
    openIn(target, "coder", focus);

    return target
}

async function runPython() {
    if (!python) {
        return
    }
    // if no file, save as
    if (current.experiment.file?.file === undefined) {
        await file_save_as()
        // if cancelled save, cancel run
        if (current.experiment.file?.file === undefined) {
            return
        }
    }
    // compile to JS
    await compilePython(false)
    // send to runner
    await sendToRunner()
    // mute error popups (errors will be shown in Runner)
    current.errorPopups = false
    // run script
    await current.experiment.runPython(false)
    // re-enable error popups
    current.errorPopups = true

    return true
}

async function stopPython(executable) {
    // cancel running
    await current.experiment.stopPython()
    // re-enable error popups
    current.errorPopups = true
}

async function runJS() {
    if (!python) {
        return
    }
    // if no file, save as
    if (current.experiment.file?.file === undefined) {
        await file_save_as()
        // if cancelled save, cancel run
        if (current.experiment.file?.file === undefined) {
            return
        }
    }
    // compile to JS
    await compileJS(false)
    // run
    if (current.experiment.pilotMode) {
        await current.experiment.runJS(true)
    } else {
        await window.open(`https://run.pavlovia.org/${current.project.namespace?.path}/${current.project.path}`)
    }
}


export default {
    new: new Callback(file_new, undefined, "new"),
    open: new Callback(file_open, undefined, "open"),
    revealFolder: new Callback(
        revealFolder,
        () => current.experiment.file?.parent === undefined,
        "revealFolder"
    ),
    save: new Callback(
        file_save,
        () => current.experiment.loading || !current.experiment.valid || (!current.experiment.history.past.length && current.experiment.file.file),
        "save"
    ),
    saveAs: new Callback(
        file_save_as,
        () => current.experiment.loading || !current.experiment.valid,
        "saveAs"
    ),
    close: new Callback(close, undefined, "close"),
    quit: new Callback(quit, undefined, "quit"),
    undo: new Callback(
        undo,
        () => !current.experiment.history.past.length,
        "undo"
    ),
    redo: new Callback(
        redo,
        () => !current.experiment.history.future.length,
        "redo"
    ),
    togglePiloting: new Callback(
        togglePiloting,
        () => !current.experiment?.settings,
        "togglePiloting"
    ),
    sendToRunner: new Callback(
        sendToRunner,
        () => !current.experiment.valid || !current.experiment.file.file,
        "sendToRunner"
    ),
    compilePython: new Callback(
        compilePython,
        () => !current.experiment.valid,
        "compilePython"
    ),
    runPython: new Callback(
        runPython,
        () => !current.experiment.valid,
        "runPython"
    ),
    stopPython: new Callback(stopPython, undefined, "stopPython"),
    compileJS: new Callback(
        compileJS,
        () => !current.experiment.valid,
        "compileJS"
    ),
    runJS: new Callback(
        runJS,
        () => !current.experiment.valid || (!current.experiment.pilotMode && !current.project),
        "runJS"
    ),
    showDevTools: new Callback(showDevTools, undefined, "showDevTools"),
    focusNextPanel: new Callback(focusNextPanel, undefined, "focusNextPanel"),
    openFile: new Callback(openFile),
    pasteRoutine: new Callback(pasteRoutine),
    copyRoutine: new Callback(copyRoutine),
    showCoder: new Callback(showCoder),
    showRunner: new Callback(showRunner),
    showReadme: new Callback(showReadme),
    resetPrefs: new Callback(resetPrefs),
    openUserFolder: new Callback(openUserFolder),
    reinstallPython: new Callback(reinstallPython),
    gotoHomepage: new Callback(gotoHomepage),
    gotoDocumentation: new Callback(gotoDocumentation),
    gotoForum: new Callback(gotoForum),
    showBuilder: new Callback(showBuilder),
    pasteComponent: new Callback(pasteComponent),
    copyComponent: new Callback(copyComponent)
}
