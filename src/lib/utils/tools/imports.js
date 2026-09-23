/**
 * Tools for working with Python import strings
 */


/**
 * Make sure an import string is in a usable state. Namely:
 * - In entry points format (module.submodule:Class.method) rather than flat import format (module.submodule.Class.method)
 * 
 * @param {string} value Import string to sanitize
 */
export function sanitizeImportString(value) {
    if (!value.includes(":")) {
        let parts = value.split(".")
        value = parts.slice(0, -1).join(".") + ":" + parts.slice(-1)
    }

    return value
}