import { uv } from "./uv.js";
import { execSync, output, resolvePackageVersion } from "./utils.js";
import { downloadFolder } from "../files.js";
import { appVersion } from "../tools/version.js";
import semver from "semver";
import logging from "../tools/logging.js";
import proc from "child_process";
import process from "process";
import path from "path";
import fs from "fs";


export class PythonVenv {
    /**
     * Use `PythonVenv.create` rather than calling this directly, as some setup needs to be async.
     */
    constructor(pythonVersion="3.10", psychopyVersion=appVersion, prerelease=false) {
        this.pythonVersion = pythonVersion
        this.psychopyVersion = psychopyVersion
        // which dogfood build we're running, if any ("release", "dev" or false)
        this.prerelease = prerelease
        // populated by `create` or `setup`
        this.executable = undefined
        // stores refs to running liaison, scripts and shells
        this.liaison = undefined
        this.scripts = {}
        this.shells = {}
        this.psychojs = {}
    }

    /**
     * Create a PythonVenv, resolving its PsychoPy version and looking for an existing executable
     *
     * @param {string} pythonVersion Python version to use
     * @param {string} psychopyVersion Target PsychoPy version
     * @param {"release"|"dev"|undefined} prerelease Branch to install unreleased psychopy-lib from, or undefined for a released version
     * @returns {Promise<PythonVenv>}
     */
    static async create(pythonVersion="3.10", psychopyVersion=appVersion, prerelease=false) {
        // resolve asterisks
        psychopyVersion = await resolvePackageVersion(psychopyVersion, "psychopy")
        // make venv object
        let venv = new PythonVenv(pythonVersion, psychopyVersion, prerelease)
        // try to get Python executable
        venv.executable = await uv.findPython(psychopyVersion)
        // if another venv object was stored while we awaited, use that so refs to it aren't orphaned
        if (psychopyVersion in venvs) {
            return venvs[psychopyVersion]
        }
        // store in venvs object
        venvs[psychopyVersion] = venv
        // if we were waiting for this venv, resolve now
        if (psychopyVersion in awaiting) {
            awaiting[psychopyVersion].resolve(venv)
            delete awaiting[psychopyVersion]
        }

        return venv
    }

    /**
     * Folder for the psychopy module
     */
    get ppyFolder() {
        return path.join(
            uv.folder, ".psychopy", this.psychopyVersion
        )
    }

    /**
     * Kill all instances of this venv
     */
    killAll() {
        /**
         * On Linux and Mac, killing the Python process doesn't kill PTB, it has to be killed by PID
         * 
         * @param {ChildProcess} _process 
         */
        function hardkill(_process) {
            if (process.platform === 'win32') {
                _process.kill(0)
            } else {
                process.kill(_process.pid)
            }
        }
        // kill liaison
        if (this.liaison) {
            hardkill(this.liaison.process)
        }
        // kill any scripts
        for (let script of Object.values(this.scripts)) {
            hardkill(script.process)
        }
        // kill any shells
        for (let shell of Object.values(this.shells)) {
            hardkill(shell.process)
        }
        // kill any PsychoJS servers
        for (let server of Object.values(this.psychojs)) {
            hardkill(server.process)
        }
    }

    /**
     * Setup this virtual environment; make sure it exists and install necessary packages.
     * 
     * @param {"release"|"dev"|false} prerelease Branch to install unreleased psychopy-lib from, or undefined for a released version
     */
    async setup(prerelease=false) {
        // remember prerelease setting so the venv can be recreated the same way
        this.prerelease = prerelease
        // make an executable if there isn't one
        if (!this.executable) {
            this.executable = await uv.makeExecutable(
                this.psychopyVersion,
                this.pythonVersion
            )
        }
        // get installed packages so we know what needs installing
        let installed = this.getPackages()
        // make sure all necessary packages are installed
        for (let [name, cmd] of Object.entries({
            // liaison is needed to send/receive messages from the app
            'liaison-py': "liaison-py[websocket]",
            // esprima and javascripthon are needed for py -> js translation
            esprima: "esprima",
            dukpy: "dukpy",
            javascripthon: ["javascripthon", "--no-deps"]
        })) {
            if (!(name in installed)) {
                await this.installPackage(cmd)
            }
        }
        // install psychopy library
        if (!("psychopy" in installed || "psychopy-lib" in installed)) {
            // get zip file to install, and choose the name of the folder it extracts to
            let source, moduleName
            if (this.psychopyVersion === "dev" || prerelease === "dev") {
                // for dev environment, install from dev branch
                source = "https://github.com/psychopy/psychopy/archive/refs/heads/dev.zip"
                moduleName = "psychopy-dev"
            } else if (prerelease === "release") {
                // for prerelease, install from release branch
                source = "https://github.com/psychopy/psychopy/archive/refs/heads/release.zip"
                moduleName = "psychopy-release"
            } else {
                // for released version, install from tag
                let pkg = "psychopy"
                if (semver.parse(this.psychopyVersion) < "2026.2.0") {
                    // older versions need to use psychopy-lib rather than psychopy to avoid installing wx
                    pkg += "-lib"
                }
                source = `https://github.com/psychopy/${pkg}/archive/refs/tags/${this.psychopyVersion}.zip`
                moduleName = `${pkg}-${this.psychopyVersion}`
            }
            let moduleFolder = path.join(this.ppyFolder, moduleName)
            // make sure there's a folder to download psychopy to
            if (!fs.existsSync(this.ppyFolder)) {
                fs.mkdirSync(this.ppyFolder, {
                    recursive: true
                })
            }
            // download zipfile
            uv.output(
                "Downloading PsychoPy library..."
            )
            try {
                await downloadFolder(
                    source,
                    this.ppyFolder,
                    moduleName
                )
                uv.output(
                    "Finished downloading PsychoPy library."
                )
            } catch (err) {
                // if folder already exists, don't redownload
                if (err.code === "EEXIST") {
                    uv.output(
                        "PsychoPy library is already downloaded, so cancelled download."
                    )
                } else {
                    // if anything else went wrong, error as usual
                    throw err
                }
            }
            // try to sync with psychopy
            try {
                await this.syncProject(
                    moduleFolder
                )
            } catch {
                // if this fails (as it will with older versions) do pip install instead
                await this.installPackage(
                    moduleFolder
                )
            }

        }
    }

    /**
     * Sync a local project with this venv
     * 
     * @param {string} folder Directory containing the project to sync
     */
    async syncProject(folder) {
        // log start
        uv.output(
            `Syncing ${folder}...\n`
        )
        // run uv command to install, pointing it at the venv containing our executable (Scripts/python.exe or bin/python)
        // --inexact stops uv from removing packages which aren't in the project (e.g. liaison-py)
        await uv.execTracked([
            "sync", "--directory", folder, "--python", this.executable, "--inexact"
        ], undefined, `uv`, {
            UV_PROJECT_ENVIRONMENT: path.dirname(path.dirname(this.executable))
        })
        // log done
        uv.output(
            `Finished syncing ${folder}.\n`
        )
    }

    /**
     * Install a package or multiple packages to this environment
     * 
     * @param {string|array<string>} name Name, path or URL of the package to install (or an array of these, for multiple packages)
     * @param {string} version Version to install (leave blank for latest)
     */
    async installPackage(name, version=undefined) {
        // log start
        output(
            `uv:${name}`, `Installing ${name}...\n`
        )
        // convert package to an array, if needed
        if (typeof name === "string") {
            name = [name]
        }
        // append version if given
        let cmdname = name
        if (version) {
            cmdname = name.map(item => `${item}==${version}`)
        }
        // run uv command to install
        await uv.execTracked([
            "pip", "install", ...cmdname, "--python", this.executable
        ], undefined, `uv:${name.join("+")}`)
        // log done
        output(
            `uv:${name.join("+")}`, `Finished installing ${name}.\n`
        )
    }

    /**
     * Uninstall a package or multiple packages from this environment
     * 
     * @param {string|array<string>} name Name, path or URL of the package to uninstall (or an array of these, for multiple packages)
     */
    async uninstallPackage(name) {
        // log start
        output(
            `uv:${name}`, `Uninstalling ${name}...`
        )
        // convert package to an array, if needed
        if (typeof name === "string") {
            name = [name]
        }
        // uninstall
        await uv.execTracked([
            "pip", "uninstall", ...name, "--python", this.executable
        ], undefined, `uv:${name}`)
        // log done
        output(
            `uv:${name}`, `Finished uninstalling ${name}.`
        )
    }

    /**
     * List installed packages and their versions
     * 
     * @returns {object<string:string>} Object mapping package names to their version
     */
    getPackages() {
        // get package list from pip
        let resp = uv.execSync([
            "pip", "list", "--python", `"${this.executable}"`, "--format", "json"
        ], undefined, "uv", true)
        // parse it
        let parsed = JSON.parse(resp)
        // simplify structure
        let output = {}
        parsed.forEach(
            profile => output[profile.name] = profile.version
        )
    
        return output
    }

    /**
     * Get information about a given package
     * 
     * @param {string} name Package name
     * @returns 
     */
    async getPackageDetails(name) {
        let all = {}
        // use pip show to get details
        let resp = uv.execSync([
            "pip", "show", name, "--python", `"${this.executable}"`
        ], undefined, "uv", true)
        // parse as an object
        let local = Object.fromEntries(
            resp.matchAll(/^(.*?): (.*?)$/gm).map(val => [val[1], val[2]])
        );
        // coerce to PyPi esque format and apply
        all.info = {
            name: local.Name,
            version: local.Version,
            requires_dist: local.Requires
        }
        all.releases = {
            [local.Version]: []
        }
        // get package from pypi if possible
        let online
        try {
            // request
            online = await fetch(
                `https://pypi.org/pypi/${name}/json`, 
                { cache: "force-cache" }
            ).then(resp => resp.json());
        } catch {
            // fail silently
            online = {}
        }
        // apply
        Object.assign(all, online)
    
        return all
    }

    /**
     * Check whether this environment's Python has the GIL enabled
     *
     * @returns {boolean} Whether or not the GIL is enabled
     */
    hasGIL() {
        // run Python directly (not via a shell) so quoting is the same on every platform
        let resp = proc.execFileSync(this.executable, ["-c", [
            "try:",
            "    import json, sysconfig",
            "    print(sysconfig.get_config_var('Py_GIL_DISABLED'))",
            "except:",
            "    print(0)"
        ].join("\n")], { encoding: "utf8" })

        return resp.trim() !== "1"
    }

    /**
     * Check whether Windows Smart App Control (or another application control policy) is stopping this
     * environment's Python from launching at all
     *
     * @returns {boolean} `true` if Python couldn't be launched on Windows, `false` otherwise
     */
    isBlocked() {
        if (process.platform !== "win32" || !this.executable || !fs.existsSync(this.executable)) {
            return false
        }
        // run without a shell, so a launch failure shows up as a spawn error rather than a nonzero exit code
        let resp = proc.spawnSync(this.executable, ["--version"], { timeout: 10000 })
        // if Python ran (even if it then failed), it wasn't blocked
        return Boolean(resp.error) && resp.error.code !== "ETIMEDOUT"
    }

    /**
     * Delete and recreate this environment, then reinstall its packages
     */
    async recreate() {
        // remake the venv (uses --clear)
        this.executable = await uv.makeExecutable(
            this.psychopyVersion,
            this.pythonVersion
        )
        // reinstall packages
        await this.setup(this.prerelease)
    }

    /**
     * Execute a Python command synchronously
     * 
     * @param {array<string>} args Arguments to execute
     * @param {int} timeout Time (ms) after which to give up
     * @param {string} tag Tag to send output to (use undefined to not emit an event)
     * @param {boolean} silent Set true to prevent output from going to stdout
     */
    execSync(args, timeout=undefined, tag="stdout", silent=false) {
        return execSync(tag, `"${this.executable}"`, args, timeout, silent)
    }

    /**
     * Spawn a Python process
     * 
     * @param {array<string>} args Arguments to pass on spawn
     * @param {object} callbacks Functions to call on stdout/stderr (`onstdout` and `onstderr`)
     * @param {string} tag Subchannel to send output over (e.g. "app" sends to `stdout:app`/`stderr:app` as well as `stdout`/`stderr`), leave undefined to only send to `stdout`/`stderr`
     */
    spawn(args, callbacks={
        onstdout: evt => {}, 
        onstderr: evt => {}
    }, tag=undefined) {
        // set initial onstdout and onstderr callbacks
        this.onstdout = callbacks.onstdout || (evt => {})
        this.onstderr = callbacks.onstderr || (evt => {})
        // spawn process
        let process = proc.spawn(this.executable, args)
        // add listener for stdout
        process.stdout.on(
            "data", evt => {
                output(tag ? `stdout:${tag}` : "stdout", evt)
                this.onstdout(evt)
            }
        )
        // add listener for errors
        process.stderr.on(
            "data", evt => {
                output(tag ? `stderr:${tag}` : "stderr", evt)
                this.onstderr(evt)
            }
        )
        // add listener to know when process exits
        process.on("exit", evt => logging.log(
            `Python process stopped, reason: ${evt?.message}`
        ))

        return process
    }
}


/**
 * Get a PythonVenv object from its PsychoPy version
 * 
 * @param {string} version Version string to look for 
 * @returns {PythonVenv}
 */
export async function getVenv(version) {
    // resolve any asterisk in the version number
    version = await resolvePackageVersion(version, "psychopy")
    // strip extras from version
    if (version.match(/\d+\.\d+\.\d+/)) {
        version = version.match(/\d+\.\d+\.\d+/)[0]
    }
    
    if (version in venvs) {
        // if made, return it
        return venvs[version]
    } else if (version in creating) {
        // if being made, wait for it rather than making a duplicate
        return creating[version]
    } else {
        // if environment exists but no object, make one
        for (let env of await uv.getEnvironments()) {
            if (env.psychopyVersion === version) {
                // check again, as another call may have started creating it while we awaited
                if (version in venvs) {
                    return venvs[version]
                }
                creating[version] ??= PythonVenv.create(
                    env.pythonVersion,
                    env.psychopyVersion
                ).finally(
                    () => delete creating[version]
                )
                return creating[version]
            }
        }
        // if none exist, await one's existance
        if (!(version in awaiting)) {
            awaiting[version] = Promise.withResolvers()
        }
        return awaiting[version].promise
    }
}

// store promises awaiting the setup of a venv here
const awaiting = {}
// store promises for venv objects which are mid-creation here
const creating = {}
// store created venvs here
export const venvs = {}
