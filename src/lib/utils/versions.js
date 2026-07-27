import semver from "semver";

export function ppy2py(version) {
    // parse version for comparisons
    version = semver.parse(version)
    // at what version of PsychoPy we updated to each version of Python
    let updates = [
        ["2022.1.0", "3.8"],
        ["2024.2.0", "3.10"],
        ["2026.2.0", "3.11"]
    ]
    // start off as 3.8
    let output = "3.8"
    // increase with each version we surpass
    for (let [ppy, py] of updates) {
        if (version === null || version > ppy) {
            output = py
        }
    }

    return output
}