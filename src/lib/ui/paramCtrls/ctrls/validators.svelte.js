/**
 * Validators for param ctrls. Each is registered by its ctrl via `param.registerValidator` and is
 * called with `(param, valid)`, where `valid` is an object with `value` and `warning` fields to
 * modify. Validators which depend on state local to their ctrl take it as additional arguments, so
 * should be registered via a closure.
 */

import { python } from "$lib/globals.svelte";
import { translate, locales } from "$lib/translation";
import { profiles } from "$lib/experiment";
import Namespace from "$lib/experiment/namespace.json";
import { prefs } from "$lib/preferences.svelte";
import { notes } from "./utils.svelte.js";
import path from "path-browserify";


/**
 * @param options Names of devices available to this ctrl
 */
export function validateDevice(param, valid, options) {
    if (options.length) {
        valid.value = options.includes(param.val) || param.val === ""
    } else {
        valid.value = true
        // get allowed device types
        let deviceTypes = []
        for (let target of param.allowedVals) {
            deviceTypes.push(
                ...Object.values(profiles.devices.value).filter(
                    profile => target.endsWith(profile.__class__)
                ).map(
                    profile => profile.label || profile.__name__
                )
            )
        }
        // construct string from allowed device types
        if (deviceTypes.length == 0) {
            valid.warning = translate(
                "No relevant devices added, use device manager to add devices."
            )
        } else if (deviceTypes.length == 1) {
            valid.warning = translate(
                "No {} devices added, use device manager to add {} devices.\n"
            ).replaceAll("{}", deviceTypes[0])
        } else {
            valid.warning = translate(
                "No relevant devices added, use device manager to add devices.\n\nRelevant devices are: "
            ) + deviceTypes.join(", ")
        }
    }
}


export function validateColor(param, valid) {
    // TODO
}


/**
 * @param numScreens Number of screens detected on this system
 */
export async function validateScreen(param, valid, numScreens) {
    // check that screen number is within number of screens on this system
    if (parseInt(param.val) > numScreens) {
        valid.warning = translate(
            "Could only detect {numScreens} screen(s), so will display on screen {target}"
        ).replaceAll("{numScreens}", numScreens).replaceAll("{target}", parseInt(param.val) % numScreens + 1)
    }
}


/**
 * @param installed Whether the font named by this param is installed
 */
export function validateFont(param, valid, installed) {
    // allow no font
    if (!param.val) {
        return
    }
    // vary the warning according to whether we're on local
    if (!installed) {
        if (python?.ready) {
            valid.warning = `Font '${param.val}' is not installed. Try installing it via the Font Manager.`
        } else {
            valid.warning = `Font '${param.val}' is not web safe.`
        }
    }

}


export function validateRichChoice(param, valid) {
    // TODO
}


export function validateVersion(param, valid) {
    valid.value = true
}


export function validateFile(param, valid, expDir) {
    // check file extension
    if (param.allowedVals) {
        if (!param.allowedVals.some(
            val => String(param.val).endsWith(val)
        )) {
            valid.value = false
            valid.warning = `Did not match allowed filetypes: ${param.allowedVals}`
        }
    }
    // warn if there's no experiment dir
    if (!expDir) {
        valid.warning = translate(
            "Experiment is not yet saved, so paths will be absolute and may not be found when the experiment is run elsewhere (e.g. online)."
        )
    }
    // warn if file is outside of experiment path
    if (param.val && !param.val.isCode && expDir) {
        // handle Windows-style separators
        let file = String(param.val).replaceAll("\\", "/")
        let folder = String(expDir).replaceAll("\\", "/")
        // resolve relative paths against the experiment folder
        if (!(path.isAbsolute(file) || /^[a-zA-Z]:\//.test(file))) {
            file = path.join(folder, file)
        }
        // get path relative to experiment folder
        let rel = path.relative(folder, file)
        // if it goes up a level (or is on another drive), it's outside
        if (rel === ".." || rel.startsWith("../") || path.isAbsolute(rel)) {
            valid.warning = translate(
                "File {} is outside of the experiment folder, so may not be found when the experiment is run elsewhere (e.g. online)."
            ).replace("{}", param.val)
        }
    }
    // todo: Check if file exists
}


export function validateSound(param, valid) {
    // allow musical notes
    if (notes.includes(param.val)) {
        valid.value = true
        valid.warning = undefined
    }
}


/**
 * @param options Names of validator Routines available to this ctrl
 */
export function validateValidator(param, valid, options) {
    if (options.length) {
        valid.value = options.includes(param.val) || param.val === ""
    } else {
        valid.value = true
        valid.warning = translate(
            "No validators added, add one via the Validation section of the Components panel."
        )
    }
}


export function validateCode(param, valid) {
    return
}


export function validateConditions(param, valid) {
    return
}


/**
 * @param current Current context (from `getContext("current")`)
 */
export function validateName(param, valid, current) {
    // must have a value
    if (String(param.val).length === 0) {
        valid.value = false
        valid.warning = translate("Must have a name")
    }
    // no spaces
    if (String(param.val).includes(" ")) {
        valid.value = false
        valid.warning = translate("Names cannot include spaces")
    }
    // no protected names
    if (Object.values(Namespace).flat().includes(String(param.val))) {
        valid.value = false
        valid.warning = translate("Name cannot be a protected keyword")
    }
    // no extant names
    if (String(param.val) in current.experiment.namespace) {
        // ...unless it's extant because it's this name
        if (current.experiment.namespace[String(param.val)] !== param) {
            valid.value = false
            valid.warning = translate("Name already in use")
        }
    }
}


export function validateMultiText(param, valid) {
    if (param.isCode) {
        valid.value = true
        valid.warning = undefined
    }
}


export function validateText(param, valid) {
    if (param.isCode) {
        valid.value = true
        valid.warning = undefined
    }
}


export function validateLocale(param, valid) {
    valid.value = locales.includes(param.val) || param.val === "system locale"
}


export function validateMultiChoice(param, valid) {
    valid.value = !Array.isArray(param.allowedVals) || !Array.isArray(param.val) || param.val.every((val) => param.allowedVals.includes(val))
}


export function validateTable(param, valid) {}


export function validateSurvey(param, valid) {}


/**
 * @param items Param objects for each item in the list
 */
export function validateFileList(param, valid, expDir, items) {
    // combine valid on all child items
    for (let item of items) {
        validateFile(item, valid, expDir)
    }
}


export function validateChoice(param, valid) {
    // skip if no allowed vals
    if (!Array.isArray(param.allowedVals)) {
        return
    }
    // stringify allowed values for comparison
    let allowedVals = param.allowedVals.map(
        val => String(val)
    )
    // if not allowed, issue warning
    if (!allowedVals.includes(String(param.val))) {
        valid.warning = `${param.val} not in list of allowed values`
    }
}


export function validateDict(param, valid) {
    // skip if param.val is still as a string
    if (typeof param.val === "string") {
        return
    }
    // create array of validation objects for each entry
    let validation = []
    // iterate through keys and values
    for (let [key, val] of Object.entries(param.val)) {
        // create validation object for key and value
        let valid = {
            key: {
                value: true,
                warning: undefined
            },
            value: {
                value: true,
                warning: undefined
            }
        }
        // if key is duplicate, mark invalid
        if (Object.keys(param.val).filter(item => item === key).length > 1) {
            valid.key.value = false
            valid.key.warning = translate("Duplicate field name: {}").replace("{}", key)
        }
        // append validation object
        validation.push(valid)
    }
    // combine valid on all child items
    valid.value = validation.every(
        valid => valid.key.value && valid.value.value
    )
    // combine warnings from child items
    valid.warning = validation.flatMap(
        valid => [valid.key.warning, valid.value.warning]
    ).join("\n")
}


export function validateKeypress(param, valid) {
    // if binding is blank, it's invalid
    if (!param.val.length) {
        valid.value = false
        valid.warning = translate("No binding set")
    }
    // iterate through existing key bindings
    for (let [name, prefParam] of Object.entries(prefs.shortcuts)) {
        // ignore the current binding (it will always match itself, duh)
        if (name === param.name) {
            continue
        }
        // if this keybinding matches on already in use, it's invalid
        if (prefParam.val.length && prefParam.val.every(val => param.val.includes(val.toUpperCase())) && param.val.every(val => prefParam.val.includes(val.toUpperCase()))) {
            valid.value = false
            valid.warning = translate(
                `Keybinding '{1}' for {2} is already in use by '{3}'`
            )
            .replace("{1}", param.val.join("+"))
            .replace("{2}", param.name)
            .replace("{3}", prefParam.label)
        }
    }
}
