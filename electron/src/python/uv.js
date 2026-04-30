import { app } from 'electron';
import { platform , arch } from "process";
import path from "path";
import fs from "fs";
import unzip from "extract-zip";
import { extract as untar } from "tar";
import { execSync, execTracked, output } from "./utils.js";
import { appVersion } from "../version.js";


export class UV {
    // folder containing the uv executables
    folder = path.join(
        app.getPath("appData"), "psychopy4", ".uv"
    )
    // folder containing Python venvs
    pyFolder = path.join(
        app.getPath("appData"), "psychopy4", ".python"
    )
    // path to the uv executable
    executable = path.join(
        app.getPath("appData"), "psychopy4", ".uv", "uv"
    )

    /**
     * @returns {boolean} `true` if uv executables exist, `false` if they don't
     */
    exists() {
        return fs.globSync("uv*", {cwd: this.folder}).length
    }

    /**
     * Setup uv; will install if not already installed
     */
    async setup() {
        // make sure folders exist
        for (let folder of [this.folder, this.pyFolder]) {
            if (!fs.existsSync(folder)) {
                fs.mkdirSync(folder, {
                    recursive: true
                })
            }
        }
        // make sure executables exist
        if (!this.exists()) {
            await this.install()
        }
    }

    /**
     * Install the uv executables
     */
    async install() {
        // make sure folders exist
        for (let folder of [this.folder, this.pyFolder]) {
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
                    let zipfile = path.join(this.folder, installers[platform][arch]);
                    fs.writeFileSync(zipfile, await blob.bytes());
                    // extract file
                    if (path.extname(zipfile) === ".zip") {
                        // extract zip file...
                        await unzip(zipfile, {
                            dir: this.folder
                        })
                    }
                    if (path.extname(zipfile) === ".gz") {
                        // extract tar.gz file...
                        untar({
                            file: zipfile,
                            cwd: this.folder,
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
    getEnvironments() {
        let output = []
        // specify Python folder
        let folder = path.join(
            app.getPath("appData"), "psychopy4", ".python"
        )
        // if there's no folder, there's no subfolders
        if (!fs.existsSync(folder)) {
            return output
        }
        // iterate through subfolders in the python folder
        for (let subfolder of fs.readdirSync(folder)) {
            // reinstate .* syntax
            if (subfolder.match(/^\d+\.\d+$/)) {
                subfolder += ".*"
            }
            // look for an executable in this folder
            let executable = this.findPython(subfolder)
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
            app.getPath("appData"), "psychopy4", ".python", psychopyVersion
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
        // strip * if present
        if (psychopyVersion.match(/\d+\.\d+\.\*/)) {
            psychopyVersion = psychopyVersion.match(/\d+\.\d+/)[0]
        }
        // get specific folder for this version
        let folder = path.join(
            app.getPath("appData"), "psychopy4", ".python", psychopyVersion
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
        try {
            await this.execTracked([
                "venv", folder, "--python", pythonVersion, "--clear"
            ])
        } catch (err) {
            // on Mac, we might need to install Rosetta first
            if (err.code === 86) {
                // install Rosetta
                await execTracked(
                    "UV", 
                    "/usr/sbin/softwareupdate", 
                    ["--install-rosetta", "--agree-to-license"]
                )
                // make venv again - this time with Rosetta
                await this.execTracked([
                    "venv", folder, "--python", pythonVersion, "--clear"
                ])
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
