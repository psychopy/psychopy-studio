/**
 * Make a name unique in a given namespace by appending/iterating a number at the end
 * 
 * @param {string} name Name to make unique
 * @param {array<string>} namespace Namespace to check for conflicts in
 */
export function makeUnique(name, namespace=[]) {
    // keep going until name is unique
    while (namespace.includes(name)) {
        // iterate/append number at the end
        name.replace(
            /(.*?)(\d*)$/,
            (_, content, n) => `${content}${n !== undefined ? parseInt(n) + 1 : 0}`
        )
    }

    return name
}