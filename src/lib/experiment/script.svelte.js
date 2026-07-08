import { python, electron } from "$lib/globals.svelte";
import { readFile, writeFile, parsePath } from "$lib/utils/files";


export class Script {
    pilotMode = $state.raw(false);
    // file this script is saved to (if any)
    file = $state();
    // text content of this script
    content = $state.raw("");
    // these are only relevant if script is open in an editor
    canUndo = $state.raw(false)
    canRedo = $state.raw(false)
    editor = $state.raw()

    constructor(file) {
        this.file = file
    }

    setPilotMode(value) {
        this.pilotMode = value
    }

    /**
     * Run this script in Python.
     * 
     * @param {string } version PsychoPy version of the venv to run this in
     */
    async runPython(version="app") {
        // fail if there's no Python to run in
        if (!python) {
            console.error("Script running is not available in browser.")
            return
        }
        // run script
        this.running = python.scripts.run(
            version,
            this.file.file,  
            ...(this.pilotMode ? ["--pilot"] : []),
            "--prefs-json",
            await electron.paths.prefs()
        )
        await this.running
    }

    /**
     * Stop running this script
     * 
     * @param {string } version PsychoPy version of the venv to cancel run in
     */
    async stopPython(version="app") {
        // do nothing if nothing is running
        if (this.running === undefined) {
            return
        }
        // fail if there's no Python to run in
        if (!python) {
            console.error("Script running is not available in browser.")
            return
        }
        // request stop from electron
        await python.scripts.stop(version, this.running)
        // mark finished
        this.running = undefined
        await python.output.stdout.send(
            `--- Stopped experiment ${this.file.name} ---`
        )
    }

    /**
     * Write the current contents of this script to a file
     */
    async toFile(file) {
        // parse to object if needed
        if (typeof file === "string") {
            file = parsePath(file)
        }
        // if we were keeping track of history, clear it now
        this.canUndo = false
        // write content to file
        writeFile(
            $state.snapshot(this.file.file),
            $state.snapshot(this.content)
        )
    }

    /**
     * Load the contents of a file to this script
     */
    async fromFile(file) {
        // parse to object if needed
        if (typeof file === "string") {
            file = parsePath(file)
        }
        // load content from file
        this.content = await readFile(file)
        // store file
        this.file = file
    }

    toJSON() {
        return $state.snapshot({
            pilotMode: this.pilotMode,
            file: this.file,
            content: this.content
        })
    }
}