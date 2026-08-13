import { Script } from "$lib/experiment/script.svelte"
import { openIn } from "$lib/utils/views.svelte"
import { python } from "$lib/globals.svelte"
import { parsePath, mime } from "$lib/utils/files"
import { electron } from "$lib/globals.svelte"

export let current = $state({
    pages: [],
    tab: 0,
    shelltab: "stdout",
    openFile: async file => {
        if (typeof file === "string") {
            file = parsePath(file)
        }
        // open in other frame if relevant
        if (file.ext === ".psyexp") {
            openIn(file.file, "builder")
            return
        }
        if (file.ext === ".psyrun") {
            openIn(file.file, "runner")
            return
        }
        // convert psydat
        if (file.ext === ".psydat") {
            let fileCSV = await python.liaison.send("app", {
                command: "run",
                args: [
                    "psychopy.tools.filetools:psydat2csv",
                    file.file
                ]
            })
            // open new path
            file = parsePath(fileCSV)
        }
        // open non-text files via system
        let mimeType = mime.getType(file.name) || "unknown"
        if (!(
            mimeType.startsWith("text") ||
            [
                "application/json", 
                "application/xml"
            ].includes(mimeType)
        )) {
            electron.files.openExternal(file.file)
            return
        }
        // if file not already open, open it
        if (!current.pages.some(
            item => item.file.file === file.file
        )) {
            current.pages.push(
                new Script(file)
            )
        }
        // focus
        current.tab = current.pages.findIndex(item => item.file.file === file.file)
        // load content from file
        await current.pages[current.tab].fromFile(file)
    },
    tip: {
        shown: false
    }
})