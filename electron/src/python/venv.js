import { uv } from "./uv.js";
import { execSync, execTracked, output } from "./utils.js";
import { appVersion } from "../version.js";
import logging from "../logging.js";
import proc from "child_process";
import process from "process";


export class PythonVenv {
    constructor(pythonVersion="3.10", psychopyVersion=appVersion) {
        this.pythonVersion = pythonVersion
        this.psychopyVersion = psychopyVersion
        // populated when `setup` is called
        this.executable = undefined
        // stores refs to running liaison, scripts and shells
        this.liaison = undefined
        this.scripts = {}
        this.shells = {}
        this.psychojs = {}
        // store in venvs object
        venvs[this.psychopyVersion] = this
        // try to get Python executable
        this.executable = uv.findPython(this.psychopyVersion)
        // if we were waiting for this venv, resolve now
        if (psychopyVersion in awaiting) {
            awaiting[psychopyVersion].resolve(this)
            delete awaiting[psychopyVersion]
        }
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
     * @param {boolean} prerelease Whether to allow unreleased versions of psychopy-lib
     */
    async setup(prerelease=false) {
        // make one if there isn't one
        if (!this.executable) {
            this.executable = await uv.makeExecutable(
                psychopyVersion,
                pythonVersion
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
        if (!("psychopy-lib" in installed)) {
            if (this.psychopyVersion === "dev") {
                // for dev environment, install from dev branch
                await this.installPackage("git+https://github.com/psychopy/psychopy@dev")
            } else if (prerelease) {
                // for prerelease, install from release branch
                await this.installPackage("git+https://github.com/psychopy/psychopy@release")
            } else {
                // for released version, install from pypi
                await this.installPackage(`psychopy-lib==${this.psychopyVersion}`)
            }
        }
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
     */
    spawn(args, callbacks={
        onstdout: evt => {}, 
        onstderr: evt => {}
    }) {
        // set initial onstdout and onstderr callbacks
        this.onstdout = callbacks.onstdout || (evt => {})
        this.onstderr = callbacks.onstderr || (evt => {})
        // spawn process
        let process = proc.spawn(this.executable, args)
        // add listener for stdout
        process.stdout.on(
            "data", evt => {
                output("stdout", evt)
                this.onstdout(evt)
            }
        )
        // add listener for errors
        process.stderr.on(
            "data", evt => {
                output("stderr", evt)
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
    // substitute "app" for app version
    if (version === "app") {
        version = appVersion
    }
    // strip extras from version
    if (version.match(/\d+\.\d+\.\d+/)) {
        version = version.match(/\d+\.\d+\.\d+/)[0]
    }
    
    if (version in venvs) {
        // if made, return it
        return venvs[version]
    } else {
        // if environment exists but no object, make one
        for (let env of await uv.getEnvironments()) {
            if (env.psychopyVersion === version) {
                return new PythonVenv(
                    env.pythonVersion, 
                    env.psychopyVersion
                )
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
// store created venvs here
export const venvs = {}
