import { app } from 'electron';
import { platform , arch } from "process";
import path from "path";
import fs from "fs";
import unzip from "extract-zip";
import { extract as untar } from "tar";
import { execSync, execTracked, output } from "./utils.js";
import { appVersion } from "../version.js";


export class UV {
    // folder in which to store executables and environments
    folder

    // will resolve when a folder has been specified
    folderSpecified = Promise.withResolvers();

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
     * Subfolder for Python environments
     */
    get pyFolder() {
        return path.join(
            this.folder, ".python"
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
            await fetch(
                `https://github.com/astral-sh/uv/releases/download/0.8.18/${installers[platform][arch]}`
            ).then(
                resp => resp.blob()
            ).then(
                async blob => {
                    this.output(`Finished downloading ${installers[platform][arch]}, extracting executable...`)
                    // write to a zipped file
                    let zipfile = path.join(this.uvFolder, installers[platform][arch]);
                    fs.writeFileSync(zipfile, await blob.bytes());
                    // extract file
                    if (path.extname(zipfile) === ".zip") {
                        // extract zip file...
                        await unzip(zipfile, {
                            dir: this.uvFolder
                        })
                    }
                    if (path.extname(zipfile) === ".gz") {
                        // extract tar.gz file...
                        untar({
                            file: zipfile,
                            cwd: this.uvFolder,
                            strip: 1,
                            sync: true
                        })
                    }
                    // delete zip file
                    fs.unlink(zipfile, err => {if (err) throw err})
                    this.output(`Finished installing UV.`)
                }
            )
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
     * @returns {string|undefined} Path to the found executable, or undefined if there is none
     */
    findPython(psychopyVersion=appVersion) {
        // substitute "app" for app version
        if (psychopyVersion === "app") {
            psychopyVersion = appVersion
        }
        // strip * if present
        if (psychopyVersion.match(/\d+\.\d+\.\*/)) {
            psychopyVersion = psychopyVersion.match(/\d+\.\d+/)[0]
        }
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
        // on MacOS ARM, enforce an Intel executable
        if (platform === "darwin" && arch === "arm64") {
            pythonVersion = `cpython-${pythonVersion}-macos-x86_64-none`
        }
        // make a new venv
        await this.execTracked([
            "venv", folder, "--python", pythonVersion, "--clear"
        ])
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
     */
    async execTracked(args, timeout=undefined, tag="uv") {
        return execTracked(tag, this.executable, args, timeout)
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
