export function ppy2py(version) {
    // make sure we have a Version object
    version = Version.parse(version)
    // at what version of PsychoPy we updated to each version of Python
    let updates = [
        ["2022.1.0", "3.8"],
        ["2024.2.0", "3.10"]
    ]
    // start off as 3.8
    let output = "3.8"
    // increase with each version we surpass
    for (let [ppy, py] of updates) {
        if (version.newerThan(ppy)) {
            output = py
        }
    }

    return output
}


export class Version {
    // regex for a valid version
    static pattern = /(?<major>\d+)\.(?<minor>\d+)(?:\.(?<patch>(?:\d+|\*))(?<extra>[\d\w]+)?)?/

    constructor(version) {
        // parse with regex
        let parts = version.match(Version.pattern).groups
        // store parts (as int, if relevant)
        this.major = parseInt(parts.major)
        this.minor = parseInt(parts.minor)
        this.patch = parts.patch === "*" ? Infinity : parseInt(parts.patch)
        this.extra = parts.extra
    }

    /**
     * Parse a string into a Version object
     * 
     * @param {string|Version} version String to parse; if given a Version, will return it unchanged
     * 
     * @returns {Version}
     */
    static parse(version) {
        // if given a Version, return it unchanged
        if (version instanceof Version) {
            return version
        }
        // create new Version from string
        return new Version(version)
    }

    /**
     * Format this version to a string
     * 
     * @param {string} upto How much of the version to include, options are:
     *   - "major": Include only the major version (2025.1.1beta -> 2025)
     *   - "major": Include up to the minor version (2025.1.1beta -> 2025.1)
     *   - "patch": Include up to the patch version (2025.1.1beta -> 2025.1.1)
     *   - "extra": Include up to the extra version, i.e. everything (2025.1.1beta -> 2025.1.1beta)
     */
    format(upto="extra") {
        let output = ""
        // add major
        output += `${this.major}`
        if (upto === "major") {
            return output
        }
        // add minor
        output += `.${this.minor}`
        if (upto === "minor") {
            return output
        }
        // add patch
        if (this.patch === Infinity) {
            output += ".*"
        } else if (this.patch !== undefined) {
            output += `.${this.patch}`
        }
        if (upto === "patch") {
            return output
        }
        // add extra
        output += `${this.extra || ""}`

        return output
    }

    /**
     * Returns true if the given version is the same as this one.
     * 
     * @param {Version|string} other Version to compare against
     * @param {string} upto How much of the version to check, options are:
     *   - "major": Only the major version (2025.1.1beta -> 2025)
     *   - "major": Up to the minor version (2025.1.1beta -> 2025.1)
     *   - "patch": Up to the patch version (2025.1.1beta -> 2025.1.1)
     *   - "extra": Up to the extra version, i.e. everything (2025.1.1beta -> 2025.1.1beta)
     */
    equal(other, upto="extra") {
        // make sure we have a Version object
        other = Version.parse(other)
        // start off true
        let output = true
        // compare major
        output &= this.major === other.major
        if (upto === "major") {
            return output
        }
        // compare minor
        output &= this.minor === other.minor
        if (upto === "minor") {
            return output
        }
        // compare patch
        output &= this.patch === other.patch
        if (upto === "patch") {
            return output
        }
        // compare extra
        output &= this.extra === other.extra

        return output
    }

    /**
     * Returns true if this version is newer than the given version
     * 
     * @param {Version|string} other Version to compare against
     * @param {boolean} equal Whether to accept equal versions
     */
    newerThan(other, equal=false) {
        // if equal, return true/false based on whether this is accepted
        if (this.equal(other)) {
            return equal
        }
        // make sure we have a Version object
        other = Version.parse(other)
        // compare major
        if (this.major > other.major) {
            return true
        }
        if (this.major < other.major) {
            return false
        }
        // if major is the same, compare minor
        if ((this.minor || 0) > (other.minor || 0)) {
            return true
        }
        if ((this.minor || 0) < (other.minor || 0)) {
            return false
        }
        // if minor is the same, compare patch
        if ((this.patch || 0) > (other.patch || 0)) {
            return true
        }
        if ((this.patch || 0) < (other.patch || 0)) {
            return false
        }
        // if other has extra and this doesn't, it's newer
        if (this.extra & !other.extra) {
            return true
        }

        return false
    }

    /**
     * Returns true if this version is older than the given version.
     * 
     * @param {Version|string} other Version to compare against
     * @param {boolean} equal Whether to accept equal versions
     */
    olderThan(other, equal=false) {
        // if equal, return true/false based on whether this is accepted
        if (this.equal(other)) {
            return equal
        }
        // make sure we have a Version object
        other = Version.parse(other)
        // compare major
        if (this.major < other.major) {
            return true
        }
        if (this.major > other.major) {
            return false
        }
        // if major is the same, compare minor
        if ((this.minor || 0) < (other.minor || 0)) {
            return true
        }
        if ((this.minor || 0) > (other.minor || 0)) {
            return false
        }
        // if minor is the same, compare patch
        if ((this.patch || 0) < (other.patch || 0)) {
            return true
        }
        if ((this.patch || 0) > (other.patch || 0)) {
            return false
        }
        // if other doesn't have extra and this does, it's older
        if (this.extra & !other.extra) {
            return false
        }

        return false
    }

    /**
     * Function which can be passed to Array.prototype.sort to sort an array of versions
     * 
     * @param {string|Version} a First element for comparison (see Array.prototype.sort)
     * @param {string|Version} b Second element for comparison (see Array.prototype.sort)
     */
    static sorter(a, b) {
        // make sure we have a Version object
        try {
            a = Version.parse(a)
        } catch {
            // if a isn't a version, put it at the end
            return 1
        }
        // do comparison
        try {
            return a.olderThan(b) ? 1 : -1
        } catch {
            // if b isn't a version, put it at the end
            return -1
        }
    }
}