import { electron, python } from "$lib/globals.svelte";
import { Param } from "$lib/experiment/param.svelte";


/**
 * Iterate a name by +1 (e.g. "field_1" becomes "field_2")
 * 
 * @param name Name to be iterated
 */
export function iterateName(name) {
    if (name.match(/\d+$/)) {
        // if name ends with a number, iterate it
        return name.replace(
            /(\d+$)/,
            (num) => String(
                parseInt(num) + 1
            )
        )
    } else {
        // otherwise, add a number
        return name + "_1"
    }
    
}


/**
 * Get param options from Python using a query string (will try calling first, then will get if 
 * that fails)
 * 
 * @param {string} query Query string to send to Python (including the python:/// prefix)
 * @param {object} params Named param objects whose values to use if referred to
 */
async function optionsFromPython(query, params={}) {
    // start off with no options (i.e. disabled)
    let options = []
    // if in web view, abort
    if (!python?.ready) {
        return options
    }
    // parse query
    let { ref, args } = query.match(/^python:\/\/\/(?<ref>.*?)(?:\((?<args>.*?)\)|$)/).groups
    // actualize args
    if (args) {
        args = args.split(/ *, */).map(
            name => {
                if (name.startsWith("$") && name.slice(1) in params) {
                    if (params[name.slice(1)] instanceof Param) {
                        return $state.snapshot(params[name.slice(1)].val)
                    } else {
                        return params[name.slice(1)]
                    }
                } else {
                    return params[name]
                }
            }
        )
    } else {
        args = []
    }
    try {
        // first try calling the arg
        options = await python.liaison.send("app", {
            command: "run",
            args: [ref, ...args]
        })
    } catch {
        // if that fails, it might be a static value, so try getting it
        options = await python.liaison.send("app", {
            command: "get",
            args: [ref, ...args]
        })
    }
    
    return options
}

/**
 * Get an object mapping options from a parameter
 * 
 * @param param Param to get options for
 */
export async function optionsFromParam(param) {
        let output = [];
        // if either allowed labels or values are a Python function, execute it
        if (typeof param.allowedVals === "string" && param.allowedVals.startsWith("python:///")) {
            // get options from Python
            try {
                param.allowedVals = await optionsFromPython(param.allowedVals, Object.assign(param.context, param.siblings))
            } catch (err) {
                // disable ctrl if this fails
                console.log(`Failed to get allowedVals for param ${param.name} (${param.allowedVals}, ${err})`)
                param.allowedVals = []
            }
        }
        if (typeof param.allowedLabels === "string" && param.allowedLabels.startsWith("python:///")) {
            // get options from Python
            try {
                param.allowedVals = await optionsFromPython(param.allowedLabels, Object.assign(param.context, param.siblings))
            } catch (err) {
                // disable ctrl if this fails
                console.log(`Failed to get allowedVals for param ${param.name} (${param.allowedVals}, ${err})`)
                param.allowedVals = []
            }
        }
        // if no allowed labels, use allowed values
        if (param.allowedLabels === undefined || param.allowedLabels.length == 0) {
            param.allowedLabels = param.allowedVals;
        }
        // if no allowed values, use allowed labels
        if (param.allowedVals === undefined || param.allowedVals.length == 0) {
            param.allowedVals = param.allowedLabels;
        }
        // if no allowed values or labels, there's no options
        if (!param.allowedVals && !param.allowedLabels) {
            return output;
        }
        // add allowed vals & labels to options
        for (let i in param.allowedVals) {
            output.push(
                [param.allowedVals[i], param.allowedLabels[i]]
            );
        }
        // add current value if not already present
        if (Array.isArray(param.val)) {
            // if value is an array, this means adding missing items
            for (let item of param.val.filter(
                item => !output.some((value) => value[0] === item)
            )) {
                output.push(
                    [item, item]
                );
            }
        } else if (!output.some((value) => value[0] === param.val)) {
            // otherwise, this means adding the value
            output.push(
                [param.val, param.val]
            );
        }
        
        return output
    }

export function mimeTypesFromParam(param) {
    let types = []
    // do we have mime types from the param?
    if (Array.isArray(param.allowedVals) && Array.isArray(param.allowedLabels) && param.allowedVals.length === param.allowedLabels.length) {
        // iterate through types
        for (let i in param.allowedVals) {
            // append mime type object
            types.push({
                description: param.allowedLabels[i],
                accept: param.allowedVals[i]
            })
        }
    }

    return types
}