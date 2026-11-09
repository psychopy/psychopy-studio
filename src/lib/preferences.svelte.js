import { electron } from "$lib/globals.svelte";
import { HasParams } from "$lib/experiment";
import FallbackPreferences from "$lib/preferences.json"


class Preferences extends HasParams {
    ready = undefined;

    // object mapping only params relevant to keyboard shortcuts
    shortcuts = $derived(Object.fromEntries(
        Object.entries(this.params).filter(
            ([name, param]) => param.valType === "keypress")
        )
    )

    constructor() {
        // initialise superclass
        super("Preferences")
        // load prefs from file
        this.ready = this.load()
    }

    /**
     * Choose appropriate command key for the current OS
     */
    async localizeCmdKey() {
        // default to CTRL
        let cmd = "CONTROL"
        // if possible, detect OS and switch to appropriate key
        if (electron) {
            // use META key for Mac OS
            if (await electron.platform() === "darwin") {
                cmd = "META"
            }
            // iterate through keypress params
            for (let param of Object.values(this.params)) {
                if (param.valType === "keypress") {
                    // substitute placeholder {CMD} for OS-specific command key
                    for (let [i, value] of Object.entries(param.val)) {
                        param.val[i] = value.replaceAll("{CMD}", cmd)
                    }
                }
            }
        }
    }

    reset() {
        // usual reset behaviour
        HasParams.prototype.reset.call(this)
        // localize cmd key
        this.localizeCmdKey()
    }

    loadJSON(data) {
        // usual JSON load behaviour
        HasParams.prototype.loadJSON.call(this, data)
        // localize cmd key
        this.localizeCmdKey()
    }

    async load() {
        let data
        if (electron) {
            // get prefs file
            let file = await electron.paths.prefs()
            // make sure it exists
            if (!(await electron.files.exists(file))) {
                // when testing, override some defaults
                if (await electron.isTest()) {
                    this.params.environmentsFolder.val = "user"
                }

                await this.save()
            }
            // load data from file
            data = JSON.parse(
                await electron.files.load(file)
            )
        } else {
            // use fallback prefs for online
            data = FallbackPreferences
        }
        // setup params from file content
        this.fromJSON(data)        
    }

    save() {
        if (electron) {
            return electron.paths.prefs()
                .then(
                    // save prefs to file
                    file => electron.files.save(
                        // JSONify first
                        file, JSON.stringify(
                            this.toJSON(), undefined, 4
                        )
                    )
                )
        }
    }
}


export let prefs = new Preferences();

