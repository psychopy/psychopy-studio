import { status } from "./globals.svelte.js"
import { electron, python } from "$lib/globals.svelte";
import { Version, ppy2py } from "$lib/utils/versions.js";
import { translate } from "$lib/translation";


/**
 * Tries to safely convert an error to a string which can be displayed in the small popup, while 
 * also printing the full thing to console
 * 
 * @param {error} err 
 */
function handleError(err) {
    // get error attribute if there is one
    if ("error" in err) {
        err = err.error
    }
    // log to console
    console.error(err)
    // send to popup
    status.ready.reject(err)
}


/**
 * Sanitize version such that e.g. "app" is replaced by Studio's version
 * 
 * @param {string} version 
 */
async function sanitizeVersion(version) {
    if (!version || version === "app") {
        version = await electron.version()
    }

    return version
}

/**
 * Install UV, a Python package manager
 * 
 * @param {boolean} forceReinstall Set as `true` to force UV to reinstall even if already installed
 */
export async function installUV(forceReinstall=false) {
    let hasUV = await python.uv.exists().catch(handleError)
    // if already installed and not forcing reinstall, return
    if (!forceReinstall && hasUV) {
        return hasUV
    }
    // open dialog to show progress
    status.message = translate("Downloading UV (a Python installer)...")
    status.dlg.message = translate(
        "### Downloading UV (a Python installer)...\n" + 
        "This is a program we use to install Python. Once it's finished installing, you won't have to see this message again."
    )
    status.dlg.shown = true
    status.dlg.busy = true
    // do install
    await python.uv.install().catch(handleError)
    status.dlg.busy = false
    // make sure install worked
    hasUV = await python.uv.exists().catch(handleError)
    if (!hasUV) {
        throw Error("UV failed to install")
    }
}

/**
 * Install Python (and PsychoPy, and dependencies)
 * 
 * @param {string} version PsychoPy version to install; set as "app" to use Studio's version
 * @param {boolean} forceReinstall Set as `true` to force a reinstall even if already installed
 */
export async function installPython(version=undefined, forceReinstall=false) {
    // sanitize version
    version = await sanitizeVersion(version)
    // remove any dogfood details from version
    try {
        version = Version.parse(version).format("patch")
    } catch {}
    // get python version
    let pyVersion
    if (version === "dev") {
        // for dev or app, assume python 3.10
        pyVersion = "3.10"
    } else {
        // make sure we have a Version object
        version = Version.parse(version)
        // oldest version we can do is 2022.1 as it's the first to use Python >3.8
        if (version.olderThan("2022.1.0")) {
            console.warn(
                `Version ${version.format()} of PsychoPy is not supported in PsychoPy Studio as it `
                + `cannot run in Python >=3.8. Using the oldest compatible version (2022.1).`
            )
            version = new Version("2022.1.*")
        }
        // get python version matching psychopy version
        pyVersion = ppy2py(version)
        // convert back to string (serializable)
        version = version.format()
    }
    // do we already have a venv?
    let hasPython = await python.uv.findPython(version).catch(handleError)
    // if installed and not forcing a reinstall, do nothing
    if (!forceReinstall && hasPython) {
        return hasPython
    }
    // open dialog to show progress
    status.message = translate("Installing Python...")
    status.dlg.message = translate(
        `### Installing Python (${pyVersion})...\n` +
        `This may take some time and, unfortunately, cannot be done in the background. Once it's finished installing, you won't have to see this message again.`
    )
    status.dlg.shown = true
    status.dlg.busy = true
    // create venv
    await python.uv.makeExecutable(
        version, pyVersion
    ).catch(handleError)
    // make sure install worked
    hasPython = await python.uv.findPython(version).catch(handleError)
    if (!hasPython) {
        throw Error("Python failed to install")
    }
    // mark as done
    status.dlg.busy = false
}


export async function installPsychoPy(version=undefined, forceReinstall=false) {
    // sanitize version
    version = await sanitizeVersion(version)
    // is this a prerelease version?
    let prerelease
    if (version === "dev") {
        prerelease = true
    } else if (Version.parse(version).extra) {
        prerelease = true
        version = Version.parse(version).format("patch")
    } else {
        prerelease = false
    }
    // remove any dogfood details from version
    try {
        version = Version.parse(version).format("patch")
    } catch {}
    // do we already have psychopy?
    let hasPsychoPy = await python.venv.getPackages(version).then(
        packages => "liaison-py" in packages && (packages.psychopy === version || version === "dev")
    )
    // if installed and not forcing a reinstall, do nothing
    if (!forceReinstall && hasPsychoPy) {
        return hasPsychoPy
    }
    // open dialog to show progress
    status.message = translate("Installing PsychoPy library...")
    status.dlg.message = translate(
        `### Installing PsychoPy library (${version ? version : "latest version"})...\n` +
        `This may take some time and, unfortunately, cannot be done in the background. Once it's finished installing, you won't have to see this message again.`
    )
    status.dlg.shown = true
    status.dlg.busy = true
    // install packages
    await python.venv.setup(version, prerelease)
    // make sure install worked
    hasPsychoPy = await python.venv.getPackages(version).then(
        packages => "liaison-py" in packages && (packages.psychopy === version || version === "dev")
    )
    if (!hasPsychoPy) {
        throw Error("PsychoPy failed to install")
    }
    // mark as done
    status.dlg.busy = false
}

export async function setupPython(version=undefined, forceReinstall=false) {
    // abort if on browser
    if (!python) {
        status.ready.resolve()
        return
    }
    // new promises
    status.ready = Promise.withResolvers();
    status.dismiss = Promise.withResolvers();
    // once status resolves, dismiss message after a brief pause
    status.ready.promise.finally(
        val => setTimeout(evt => status.dismiss.resolve(val), 2000)
    )
    // sanitize version
    version = await sanitizeVersion(version)

    // make sure we have UV
    await installUV(false).catch(handleError)
    // make sure we have a venv
    await installPython(version, forceReinstall).catch(handleError)
    // make sure psychopy is installed
    await installPsychoPy(version, forceReinstall).catch(handleError)

    // is Python already running?
    status.message = translate("Connecting Python")
    if (await python.liaison.started(version)) {
        // mark as connected
        status.message = translate("Connected Python")
        status.ready.resolve(true)
    } else {
        // start python
        status.message = translate("Starting Python...")
        await python.liaison.start(version).catch(handleError)
        // mark success
        status.message = translate("Successfully started Python")
        status.ready.resolve(true)
    }
    // mark python global as ready once Liaison has started
    python.liaison.ready(version).then(
        evt => python.ready = true
    )

    return python
}