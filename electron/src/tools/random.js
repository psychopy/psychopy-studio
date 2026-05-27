/** 
 * Generate a random integer in the given range
 * 
 * @param {number} min Minimum integer to return
 * @param {number} max Maximum integer to return
 *  
 * @returns A random integer from the given range
 */
export function randint(min, max) {
    return min + Math.floor(Math.random() * max)
}

/**
 * Choose a random value from the given iterable
 * 
 * @param {string|array} arr Iterate (string or array) to choose from
 *  
 * @returns A random value from this iterable
 */
export function randof(arr) {
    if (typeof arr === "string") {
        return arr.charAt(randint(0, arr.length))
    } else {
        return arr[randint(0, arr.length)]
    }
}