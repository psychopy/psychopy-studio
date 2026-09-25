import proc from "child_process";
import logging from "../logging.js";
import { BrowserWindow } from "electron";
import tcp from "tcp-port-used";
import { extract as unzip } from "@electron-internal/extract-zip";
import { extract as untar } from "tar";
import fs from "fs";
import path from "path";
import semver from "semver";
import { appVersion } from "../version.js";


export const decoder = new TextDecoder();


/**
 * Download and extract a folder from a zip/tar file online
 * 
 * @param {string} url URL to zip/tar file to download
 * @param {string} target Folder path to extract folder to
 */
export async function downloadFolder(
    url,
    target
) {
    // get filename from url
    let filename = URL.parse(url).pathname.split("/").at(-1)
    // get file content as a blob
    let data = await fetch(url).then(resp => resp.blob()).then(blob => blob.bytes())
    // write to a zipped file
    let zipfile = path.join(target, filename);
    fs.writeFileSync(zipfile, data);
    // extract file
    if (path.extname(zipfile) === ".zip") {
        // extract zip file...
        await unzip(zipfile, {
            dir: target
        })
    }
    if (path.extname(zipfile) === ".gz") {
        // extract tar.gz file...
        await untar({
            file: zipfile,
            cwd: target,
            strip: 1,
            sync: true
        })
    }
    // delete zip file
    fs.unlink(zipfile, err => {if (err) throw err})
}


/**
 * Use PyPi to resolve an asterisk in a version number (e.g. psychopy 2022.2.* => 2022.2.5)
 * 
 * @param {string} version Version number to resolve
 * @param {string} pipname Package this version number pertains to
 */
export async function resolvePackageVersion(version, pipname) {
    // substitute "app" for app version
    if (pipname === "psychopy" && version === "app") {
        version = appVersion
    }
    // return as is if no asterisk
    if (!version.includes("*")) {
        return version
    }
    // get versions of the given package on PyPi (use cache if present)
    let candidates 
    if (!(pipname in resolvePackageVersion.cache)) {
        resolvePackageVersion.cache[pipname] = await fetch(
            `https://pypi.org/pypi/${pipname}/json`
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
            // get array of versions
            resp => Object.keys(resp.releases)
        )
    }
    candidates = resolvePackageVersion.cache[pipname]
    // parse as if given a .0 release to get an object for the release series
    let series = semver.parse(version.replaceAll(".*", ".0"))
    // filter for just versions in this series
    candidates = candidates.filter(
        v => (
            series
            && semver.valid(v)
            && semver.major(v) === series.major
            && semver.minor(v) === series.minor
        )
    )
    // error if there are no matching versions
    if (!candidates.length) {
        throw new Error(`Could not find a version of ${pipname} matching ${version}`)
    }
    // get highest version from those left
    return candidates.sort(semver.compare).at(-1)
}
// cache versions by package so we only have to query pypi once per session
resolvePackageVersion.cache = {}


/**
 * Get an unused localhost address which is safe to start Liaison at
 */
export async function getSafeAddress() {
    // start with 8002
    let port = 8002
    // check initially
    let inUse = await tcp.check(port, "localhost")
    // if in use, iterate and try again
    while (inUse) {
        port += 1
        inUse = await tcp.check(port, "localhost")
    }

    return `localhost:${port}`
}


/**
 * Send some output to the front end
 * 
 * @param {string} tag Channel to send over (use undefined to not emit an event), you can specify subchannels using ":" (e.g. `uv:psychopy-cedrus` will go to both `uv` and `uv:psychopy-cedrus`)
 * @param {string|Buffer} message Message to send, can be either bytes or a string
 */
export function output(tag, message) {
    // get all channels to send output to (using : syntax)
    let channels = []
    if (tag) {
        // add initial tag
        channels.push(tag)
        // add each parent in tree
        while (tag?.includes?.(":")) {
            tag = tag.substring(0, tag.lastIndexOf(":"))
            channels.push(tag)
        }
    }
    // if given a buffer, decode it
    if (message instanceof Buffer) {
        message = decoder.decode(message)
    }
    // log message
    logging.log(message, tag?.toUpperCase?.())
    // emit event
    for (let channel of channels) {
        BrowserWindow.getAllWindows().forEach(
            win => win.webContents.send(channel, message)
        )
    }
}


/**
 * Log some input to the front end (works the same as logging output, only formatted differently). 
 * 
 * NOTE: this doesn't call the command, just tells the front end what was called.
 * 
 * @param {string} tag Channel to send over (use undefined to not emit an event)
 * @param {string|Buffer} message Message to send, can be either bytes or a string
 */
export function input(tag, message, timeout=undefined) {
    // if given a buffer, decode it
    if (message instanceof Buffer) {
        message = decoder.decode(message)
    }
    // prepend >>
    message = `>> ${message}`
    // append timeout
    if (timeout) {
        message = `${message} (timeout = ${timeout}ms)`
    }
    // send as output with prepended >>
    output(tag, message)
}


/**
 * Execute a function synchronously with output sent to the front end
 * 
 * @param {string} tag Channel to send any output over
 * @param {string} command Command to run
 * @param {array<string>} args Arguments to pass to child process
 * @param {int} timeout Time (ms) after which to give up
 * @param {boolean} silent Set true to prevent output from going to stdout
 */
export function execSync(tag, command, args, timeout=undefined, silent=false) {
    // join args 
    let cmd = [command, ...args].join(" ")
    // log input in front end
    if (!silent) {
        input(tag, cmd, timeout)
    }
    
    // execute
    let resp = proc.execSync(cmd, {timeout: timeout})
    // decode resp if necessary
    if (resp instanceof Buffer) {
        resp = decoder.decode(resp)
    }
    // strip resp if necessary
    if (typeof resp === "string") {
        resp = resp.trim()
    }
    // pass output to front end
    if (!silent) {
        output(tag, resp)
    }

    return resp
}

/**
 * Execute a function with output sent to the front end
 * 
 * @param {string} tag Channel to send any output over
 * @param {string} command Command to run
 * @param {array<string>} args Arguments to pass to child process
 * @param {int} timeout Time (ms) after which to give up, leave undefined to not timeout
 * @param {object} env Extra environment variables to set for the child process
 */
export async function execTracked(tag, command, args, timeout=undefined, env={}) {
    // log input in front end
    input(tag, `${command} ${(args || []).join(" ")}`, timeout)
    // execute asynchronously
    let process = proc.spawn(command, args, {
        timeout: timeout,
        env: {...globalThis.process.env, ...env}
    })
    // pass output to front end
    process.stdout.on("data", evt => output(tag, evt))
    process.stderr.on("data", evt => output(tag, evt))
    // await completion/error
    let promise = Promise.withResolvers()
    process.on("close", (code, signal) => promise.resolve([code, signal]))
    process.on("error", err => promise.reject(err))

    return promise.promise
}