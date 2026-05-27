import path from "path-browserify";
import { translate } from "$lib/translation";


class _FontManager {
    // fonts installed on the system
    system = $state({
        label: translate("System"),
        description: translate("Fonts which are installed to your computer"),
        fonts: [],
        scanning: Promise.resolve(true),
        refresh: () => {
            // clear fonts
            this.system.fonts.length = 0
            // scan for fonts
            this.system.scanning = python.liaison.send("app",
                {
                    command: "run",
                    args: [
                        `psychopy.tools.fontmanager:FontFinder.getSystemFonts`
                    ]
                }, 
                1000
            ).then(
                resp => this.system.fonts.push(...Object.keys(resp))
            ).catch(
                err => console.error(err)
            )
        }
    })
    // fonts packaged with PsychoPy
    packaged = $state({
        label: translate("Packaged"),
        description: translate("Fonts which come packaged with PsychoPy"),
        fonts: [],
        scanning: Promise.resolve(true),
        refresh: () => {
            // clear fonts
            this.packaged.fonts.length = 0
            // scan for fonts
            this.packaged.scanning = python.liaison.send("app",
                {
                    command: "run",
                    args: [
                        `psychopy.tools.fontmanager:FontFinder.getPackagedFonts`
                    ]
                }, 
                1000
            ).then(
                resp => this.packaged.fonts.push(...Object.keys(resp))
            ).catch(
                err => console.error(err)
            )
        }
    })
    // fonts downloaded to the user folder
    user = $state({
        label: translate("User"),
        description: translate("Fonts saved to your PsychoPy user folder"),
        fonts: [],
        scanning: Promise.resolve(true),
        refresh: () => {
            // clear fonts
            this.user.fonts.length = 0
            // scan for fonts
            this.user.scanning = python.liaison.send("app",
                {
                    command: "run",
                    args: [
                        `psychopy.tools.fontmanager:FontFinder.getUserFonts`
                    ]
                }, 
                1000
            ).then(
                resp => this.user.fonts.push(...Object.keys(resp))
            ).catch(
                err => console.error(err)
            )
        },
        add: () => {
            // todo: Function to download a font to the user folder
        }
    })
    // fonts in the current experiment folder
    experiment = $state({
        label: translate("Experiment"),
        description: translate("Fonts in the current experiment folder"),
        fonts: [],
        scanning: Promise.resolve(true),
        refresh: (experiment) => {
            // clear fonts
            this.experiment.fonts.length = 0
            // get folder
            let folder = experiment.file.parent
            if (folder) {
                // search in fonts and assets/fonts subfolders
                this.experiment.scanning = python.liaison.send("app",
                    {
                        command: "run",
                        args: [
                            `psychopy.tools.fontmanager:FontFinder.getFolderFonts`,
                            [
                                path.join(folder, "fonts"),
                                path.join(folder, "assets", "fonts")
                            ],
                            false
                        ]
                    }, 
                    1000
                ).then(
                    resp => this.experiment.fonts.push(...Object.keys(resp))
                ).catch(
                    err => console.error(err)
                )
            }
        },
        add: (name) => {
            // todo: Function to download a font to the experiment folder
        }
    })

    // combines all sources
    all = $derived({
        fonts: [
            ...this.system.fonts,
            ...this.packaged.fonts,
            ...this.user.fonts,
            ...this.experiment.fonts
        ],
        scanning: Promise.all([
            this.system.scanning,
            this.packaged.scanning,
            this.user.scanning,
            this.experiment.scanning
        ]),
        refresh: () => {
            this.system.refresh()
            this.packaged.refresh()
            this.user.refresh()
        }
    })
}


export const FontManager = new _FontManager()