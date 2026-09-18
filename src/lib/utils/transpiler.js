export function js2py(val) {
    // substitute JS style booleans
    if (val === true || val === "true") {
        val = "True"
    }
    if (val === false || val === "false") {
        val = "False"
    }
    if (val === null) {
        val = "None"
    }
    // recursively jsonise a dict
    if (val instanceof Object) {
        val = JSON.stringify(val)
    }

    return val
}

export function py2js(val) {
    // substitute JS style booleans
    if (val === "True") {
        val = true
    }
    if (val === "False") {
        val = false
    }
    if (val === "None") {
        val = null
    }
    // handle XML-ised newlines
    if (typeof val === "string") {
        val = val.replaceAll("&#10;", "\n")
    }
    // recursively parse a JSON
    if (String(val).match(/^\{.*\}$|^\[.*\]$/g)) {
        try {
            val = JSON.parse(
                sanitizeJSON(val)
            )
        } catch {
            // leave val as-is if this fails
        }
        
    }

    return val
}

export function sanitizeJSON(val) {
    // make sure val is a string
    val = String(val)
    // replace unescaped single quotes with double quotes for JSON compatibility
    return val.replace(
        /"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'/g,
        (_, dq, sq) => {
            // return anything already in doublequotes as-is
            if (dq !== undefined) {
                return `"${dq}"`
            }
            // escaped single quotes don't need escaping within doublequotes...
            let content = sq.replaceAll("\\'", "'")
            // ... but double quotes do
            content = content.replaceAll(/(?<!\\)"/g, "\\\"")
            
            return `"${content}"`
        }
    )
}