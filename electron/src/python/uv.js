import { app } from 'electron';
import { platform , arch } from "process";
import path from "path";
import fs from "fs";
import semver from "semver";
import { execSync, execTracked, output, resolvePackageVersion } from "./utils.js";
import { downloadFolder } from "../files.js";
import { appVersion } from "../tools/version.js";


export class UV {
    // folder in which to store executables and environments
    folder

    // will resolve when a folder has been specified
    folderSpecified = Promise.withResolvers();

    // defines the version of UV to install
    version = "0.12.5"

    /**
     * Choose a folder for the given directory option according to the current OS.
     * 
     * @param {'user'|'global'|'admin'} option Named directory option, one of @enum {string} [
     *  @value 'user' A writable user-specific folder
     *  @value 'global' A writable folder which is common to all users
     * ]
     */
    findDirectory(option) {
        if (option === "user") {
            // use electron-defined app data folder
            return path.join(
                app.getPath("appData"), "psychopy4"
            )
        } else if (option === "global") {
            if (platform === "win32") {
                // on Windows, use ProgramData
                return path.join(
                    process.env.ALLUSERSPROFILE, "psychopy4"
                )
            } else if (platform === "darwin") {
                // on Mac, use global application support
                return "/Library/Application Support/psychopy4"
            } else if (platform === "linux") {
                // on Linux, use library folder
                return "/var/lib/psychopy4"
            }
        } else {
            throw new Error(
                "UV directory must be one of 'user', 'global'"
            )
        }
    }

    /**
     * Set install directory to one of the allowed options.
     * 
     * @param {'user'|'global'|'admin'} option Named directory option, one of @enum {string} [
     *  @value 'user' A writable user-specific folder
     *  @value 'global' A writable folder which is common to all users
     * ]
     */
    setDirectory(option) {
        // set folder
        this.folder = this.findDirectory(option)
        // mark folder as specified
        this.folderSpecified.resolve()
    }

    /**
     * Information about the current system
     */
    get systemInfo() {
        return {
            platform: platform,
            arch: arch
        }
    }

    /**
     * Subfolder for Python environments
     */
    get pyFolder() {
        return path.join(
            this.folder, ".python"
        )
    }

    /**
     * Subfolder for standalone Python executables (always in the user folder)
     */
    get executablesFolder() {
        return path.join(
            this.findDirectory("user"), ".python", ".executables"
        )
    }

    /**
     * Subfolder for the UV executables
     */
    get uvFolder() {
        return path.join(
            this.folder, ".uv"
        )
    }

    /**
     * Path to the uv executable
     */
    get executable() {
        return path.join(
            this.uvFolder, "uv"
        )
    }

    /**
     * @returns {boolean} `true` if uv executables exist, `false` if they don't
     */
    async exists() {
        // wait until folder has been specified
        await this.folderSpecified.promise

        return fs.globSync("uv*", {cwd: this.uvFolder}).length
    }

    /**
     * Setup uv; will install if not already installed
     */
    async setup() {
        // wait until folder has been specified
        await this.folderSpecified.promise
        // make sure folders exist
        for (let folder of [this.uvFolder, this.pyFolder]) {
            if (!fs.existsSync(folder)) {
                fs.mkdirSync(folder, {
                    recursive: true
                })
            }
        }
        // make sure executables exist
        if (!(await this.exists())) {
            await this.install()
        }
    }

    /**
     * Check whether UV needs updating
     */
    async needsUpdate() {
        // if not installed, then it does need an update
        if (!(await this.exists())) {
            return true
        }
        // get current version
        let installed = this.execSync(["self", "version"])
        // check if it's the same one indicated by Studio
        return !installed.includes(this.version)
    }

    /**
     * Install the uv executables
     */
    async install() {
        // wait until folder has been specified
        await this.folderSpecified.promise
        // make sure folders exist
        for (let folder of [this.uvFolder, this.pyFolder]) {
            if (!fs.existsSync(folder)) {
                fs.mkdirSync(folder, {
                    recursive: true
                })
            }
        }
        // map installers to system architectures
        let installers = {
            win32: {
                x64: "uv-x86_64-pc-windows-msvc.zip",
                x86: "uv-i686-pc-windows-msvc.zip",
                arm64: "uv-aarch64-pc-windows-msvc.zip",
            },
            darwin: {
                x64: "uv-x86_64-apple-darwin.tar.gz",
                arm64: "uv-aarch64-apple-darwin.tar.gz"
            },
            linux: {
                x64: "uv-x86_64-unknown-linux-gnu.tar.gz",
                x86: "uv-i686-unknown-linux-gnu.tar.gz",
                arm: "uv-armv7-unknown-linux-gnueabihf.tar.gz",
                arm64: "uv-aarch64-unknown-linux-gnu.tar.gz",
                ppc: "uv-powerpc64-unknown-linux-gnu.tar.gz",
                s390x: "uv-s390x-unknown-linux-gnu.tar.gz",
                ppc64: "uv-powerpc64le-unknown-linux-gnu.tar.gz",
                ricsv: "uv-riscv64gc-unknown-linux-gnu.tar.gz",
            }
        }
        // Linux requires some further distinctions
        if (platform === "linux") {
            // use different installers for MUSL linux
            if (!process.report.getReport().header?.glibcVersionRuntime) {
                installers.linux = {
                    x64: "uv-x86_64-unknown-linux-musl.tar.gz",
                    x86: "uv-i686-unknown-linux-musl.tar.gz",
                    arm: "uv-armv7-unknown-linux-musleabihf.tar.gz",
                    arm64: "uv-aarch64-unknown-linux-musl.tar.gz",
                }
            }
        }
        // get relevant executable 
        this.output(`Downloading UV for ${platform} (${arch})...`)
        try {
            await downloadFolder(
                `https://github.com/astral-sh/uv/releases/download/${this.version}/${installers[platform][arch]}`,
                path.dirname(this.uvFolder),
                path.basename(this.uvFolder),
                true
            )
            this.output(`Finished installing UV.`)
        } catch (err) {
            this.output(err?.error || err)
        }
    }

    /**
     * Get known Python environments
     */
    async getEnvironments() {
        let output = []
        // wait until folder has been specified
        await this.folderSpecified.promise
        // if there's no folder, there's no subfolders
        if (!fs.existsSync(this.pyFolder)) {
            return output
        }
        // iterate through subfolders in the python folder
        for (let subfolder of fs.readdirSync(this.pyFolder)) {
            // skip hidden folders (e.g. .executables), as these aren't environments
            if (subfolder.startsWith(".")) {
                continue
            }
            // reinstate .* syntax
            if (subfolder.match(/^\d+\.\d+$/)) {
                subfolder += ".*"
            }
            // look for an executable in this folder
            let executable = await this.findPython(subfolder)
            // skip this folder if it doesn't have one
            if (!executable) {
                continue
            }
            // get Python version
            let pyVersion = execSync(undefined, `"${executable}"`, ["--version"]).match(/Python (\d+\.\d+)/)[1]
            // store
            output.push({
                executable: executable,
                psychopyVersion: subfolder,
                pythonVersion: pyVersion
            })
            
        }
        
        return output
    }
    
    /**
     * Find the Python executable for the given PsychoPy version
     * 
     * @param {string} psychopyVersion PsychoPy version to look for
     * @returns {Promise<string|undefined>} Path to the found executable, or undefined if there is none
     */
    async findPython(psychopyVersion=appVersion) {
        // resolve asterisks
        psychopyVersion = await resolvePackageVersion(psychopyVersion, "psychopy")
        // get specific folder for this version
        let folder = path.join(
            this.pyFolder, psychopyVersion
        )
        // try using UV to search for a Python executable
        try {
            return this.execSync(["python", "find", `"${folder}"`])
        } catch (err) {
            // if this fails, return undefined (as there is none)
            return
        }
    }

    /**
     * Get a signed Python executable from python.org's NuGet packages (Windows only). Python builds
     * installed by uv are unsigned, so can be blocked by Windows Smart App Control.
     *
     * @param {string} pythonVersion Python version to get, either X.Y (for the latest patch) or X.Y.Z
     * @returns {Promise<string>} Path to the Python executable
     */
    async getSignedPython(pythonVersion) {
        // get specific folder for this version
        let folder = path.join(
            this.executablesFolder, pythonVersion
        )
        let executable = path.join(folder, "python.exe")
        // use existing executable if there is one
        if (fs.existsSync(executable)) {
            return executable
        }
        // python.org publishes a different NuGet package for each architecture
        let pkg = {
            x64: "python",
            ia32: "pythonx86",
            arm64: "pythonarm64"
        }[arch]
        if (!pkg) {
            throw new Error(`No Python NuGet package for architecture ${arch}`)
        }
        // get versions of the package on NuGet
        let candidates = await fetch(
            `https://api.nuget.org/v3-flatcontainer/${pkg}/index.json`
        ).then(
            resp => {
                // error if getting versions fails
                if (resp.ok) {
                    return resp.json()
                } else {
                    throw new Error(resp.status)
                }
            }
        ).then(
            resp => resp.versions
        )
        // get highest full release matching the requested version
        let version = candidates.filter(
            v => (
                semver.valid(v)
                && !semver.prerelease(v)
                && v.split(".").slice(0, pythonVersion.split(".").length).join(".") === pythonVersion
            )
        ).sort(semver.compare).at(-1)
        if (!version) {
            throw new Error(`Could not find a NuGet release of Python matching ${pythonVersion}`)
        }
        // clear any leftovers from a previous failed download
        let download = path.join(
            this.executablesFolder, `.${pythonVersion}.download`
        )
        for (let target of [folder, download]) {
            fs.rmSync(target, { recursive: true, force: true })
        }
        fs.mkdirSync(this.executablesFolder, {
            recursive: true
        })
        // download and extract package
        this.output(`Downloading Python ${version} from python.org...`)
        await downloadFolder(
            `https://api.nuget.org/v3-flatcontainer/${pkg}/${version}/${pkg}.${version}.nupkg`,
            this.executablesFolder,
            path.basename(download)
        )
        // Python itself is in the package's tools folder, so move that into place
        fs.renameSync(
            path.join(download, "tools"), folder
        )
        fs.rmSync(download, { recursive: true, force: true })
        this.output(`Finished installing Python ${version}.`)

        return executable
    }

    /**
     * Create a Python executable for the given PsychoPy version (without any packages yet)
     * 
     * @param {string} pythonVersion Python version to use for the executable
     * @param {string} psychopyVersion Target PsychoPy version
     * @returns {string} Path to the created executable
     */
    async makeExecutable(psychopyVersion=appVersion, pythonVersion="3.10") {
        // wait until folder has been specified
        await this.folderSpecified.promise
        // strip * if present
        if (psychopyVersion.match(/\d+\.\d+\.\*/)) {
            psychopyVersion = psychopyVersion.match(/\d+\.\d+/)[0]
        }
        // get specific folder for this version
        let folder = path.join(
            this.pyFolder, psychopyVersion
        )
        // make sure folder exists
        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder, {
                recursive: true
            })
        }
        // on Windows, use a signed Python from python.org so it isn't blocked by Smart App Control
        let python = pythonVersion
        if (platform === "win32") {
            try {
                python = await this.getSignedPython(pythonVersion)
            } catch (err) {
                // if this fails, let uv get Python itself
                this.output(`Could not get Python ${pythonVersion} from python.org, falling back to uv: ${err?.message || err}`)
            }
        }
        // create venv
        try {
            await this.execTracked([
                "venv", folder, "--python", python, "--clear"
            ])
        } catch (err) {
            // on Mac, we might need to install Rosetta first
            if (
                err.code === 86 
                && platform === "darwin" 
                && arch === "arm64"
            ) {
                // install Rosetta
                await execTracked(
                    "UV", 
                    "/usr/sbin/softwareupdate", 
                    ["--install-rosetta", "--agree-to-license"]
                )
                // make venv again - this time with Rosetta
                await this.execTracked([
                    "venv", folder, "--python", python, "--clear", "--no-config"
                ])
            } else {
                throw err
            }
        }
        // return its path
        return this.findPython(psychopyVersion)
    }

    /**
     * Execute a uv command synchronously
     * 
     * @param {array<string>} args Arguments to execute
     * @param {int} timeout Time (ms) after which to give up
     * @param {string} tag Tag to send output to (use undefined to not emit an event)
     * @param {boolean} silent Set true to prevent UV output from going to stdout
     */
    execSync(args, timeout=undefined, tag="uv", silent=false) {
        return execSync(tag, `"${this.executable}"`, args, timeout, silent)
    }

    /**
     * Execute a uv command asynchronously, sending output to the front end
     * 
     * @param {array<string>} args Arguments to execute
     * @param {int} timeout Time (ms) after which to give up
     * @param {string} tag Tag to send output to (use undefined to not emit an event)
     * @param {object} env Extra environment variables to set for the child process
     */
    async execTracked(args, timeout=undefined, tag="uv", env={}) {
        return execTracked(tag, this.executable, args, timeout, env)
    }

    /**
     * Send output to the front end, tagged as coming from UV
     * 
     * @param {string|Buffer} message Message to send, can be either bytes or a string
     */
    output(message) {
        output("uv", message)
    }
}

// uv really only needs one instance, so create it here
export const uv = new UV()
