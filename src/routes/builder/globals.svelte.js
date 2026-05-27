import { Experiment, Script } from "$lib/experiment";
import { Clipboard } from "$lib/utils/clipboard";


export let current = $state({
    user: undefined,
    file: undefined,
    project: undefined,
    experiment: new Experiment(),
    readme: {
        shown: false,
        script: new Script("readme.md")
    },
    tip: {
        shown: false
    },
    routine: undefined,
    moving: undefined,
    inserting: undefined,
    clipboard: new Clipboard(),
    // setting this as false mutes "Python error..." popups
    errorPopups: true
})
