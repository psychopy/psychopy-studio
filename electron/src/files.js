import { ipcMain, dialog, shell } from "electron";
import fs from "node:fs";
import https from "node:https";
import path from "node:path";
import { extract as unzip } from "@electron-internal/extract-zip";
import { extract as untar } from "tar";
import { windows } from "./frames.js";


/**
 * Read the contents of a text file
 * 
 * @param {string} file Path of the file to read
 * @returns {string} Contents of the file (as UTF-8)
 */
export function load(file) {
    return fs.readFileSync(file, { encoding: 'utf8' })
}

/**
 * Write text to a file, creating it if it doesn't exist and overwriting it if it does
 * 
 * @param {string} file Path of the file to write to
 * @param {string} content Text to write (as UTF-8)
 */
export function save(file, content) {
    return fs.writeFileSync(file, content, { encoding: 'utf8', mode: 0o777 })
}

/**
 * Check whether a file or folder exists
 * 
 * @param {string} file Path to check
 * @returns {boolean} True if something exists at the given path
 */
export function exists(file) {
    return fs.existsSync(file)
}

/**
 * Get information about a file or folder. Same as `fs.statSync`, but with `isDirectory` and
 * `isFile` as values rather than methods, so they survive being sent over IPC
 * 
 * @param {string} file Path of the file or folder
 * @returns {object} Stats for the file or folder
 */
export function stat(file) {
    let stat = fs.statSync(file)
    return Object.assign({
        isDirectory: stat.isDirectory(),
        isFile: stat.isFile()
    }, stat)
}

/**
 * Create a folder
 * 
 * @param {string} folder Path of the folder to create
 * @param {boolean} recursive If true (default), also create any missing parent folders
 * @returns {string|undefined} If recursive, the first folder created (or undefined if none were created)
 */
export function mkdir(folder, recursive = true) {
    return fs.mkdirSync(folder, { recursive: recursive })
}

/**
 * Show a dialog for choosing files/folders to open
 * 
 * @param {object} options Options for the dialog, see Electron's `dialog.showOpenDialogSync`
 * @param {BrowserWindow} win Window to attach the dialog to, if any
 * @returns {string[]|undefined} Chosen paths, or undefined if the dialog was cancelled
 */
export function openDialog(options, win = undefined) {
    return dialog.showOpenDialogSync(win, options)
}

/**
 * Show a dialog for choosing where to save a file
 * 
 * @param {object} options Options for the dialog, see Electron's `dialog.showSaveDialogSync`
 * @param {BrowserWindow} win Window to attach the dialog to, if any
 * @returns {string} Chosen path, or an empty string if the dialog was cancelled
 */
export function saveDialog(options, win = undefined) {
    return dialog.showSaveDialogSync(win, options)
}

/**
 * List the contents of a folder, with folders sorted before files
 * 
 * @param {string} root Path of the folder to list
 * @param {boolean} recursive If true, also list the contents of all subfolders
 * @returns {string[]} Paths of each item, relative to root
 */
export function scandir(root, recursive) {
    return fs.readdirSync(root, { recursive: recursive }).sort(
        (a, b) => fs.statSync(path.join(root, b)).isDirectory() - fs.statSync(path.join(root, a)).isDirectory()
    )
}

/**
 * Show a file in the system's file manager, selecting it if possible
 * 
 * @param {string} folder Path of the file or folder to show
 */
export function showItemInFolder(folder) {
    return shell.showItemInFolder(folder)
}

/**
 * Open a file or folder with the system's default application
 * 
 * @param {string} target Path of the file or folder to open
 * @returns {Promise<string>} Resolves to an error message, or an empty string on success
 */
export function openPath(target) {
    return shell.openPath(target)
}

/**
 * Open a URL with the system's default application (e.g. a web browser)
 * 
 * @param {string} url URL to open
 * @returns {Promise<void>}
 */
export function openExternal(url) {
    return shell.openExternal(url)
}

/**
 * Download and extract a folder from a zip/tar file online
 * 
 * @param {string} url URL to zip/tar file to download
 * @param {string} target Folder path to extract folder to
 * @param {string|undefined} name Name to give the extracted folder; leave as undefined to use the name it has online
 * @param {boolean} overwrite Whether or not to overwrite target folder, if it already exists
 */
export async function downloadFolder(
    url,
    target,
    name=undefined,
    overwrite=false
) {
    /**
     * Check whether target folder already exists and has files
     * 
     * @param {string} targetFolder Folder to check
     * @returns {boolean} `true` if there's a conflict, `false` otherwise
     */
    function hasConflict(targetFolder) {
        if (fs.existsSync(targetFolder)) {
            // folder exists...
            if (fs.readdirSync(targetFolder).length) {
                // ...and has files
                return true
            } else {
                // ...but is empty, so can be overwritten
                return false
            }
        } else {
            // folder doesn't exist
            return false
        }
    }

    // if given a name for extracted folder but told not to overwrite, we can check conflict before downloading
    if (name && !overwrite && hasConflict(path.join(target, name))) {
        throw Object.assign(
            new Error(`Could not download ${url} to ${path.join(target, name)} as folder already exists and is not empty.`),
            { code: "EEXIST", path: path.join(target, name) }
        )
    }
    // get filename from url
    let filename = URL.parse(url).pathname.split("/").at(-1)
    // get file content (using https rather than fetch, as GitLab rejects fetch's `Sec-Fetch-Mode: cors` header)
    let get = (url) => new Promise((resolve, reject) => {
        https.get(url, resp => {
            // follow redirects
            if (resp.statusCode >= 300 && resp.statusCode < 400 && resp.headers.location) {
                resp.resume()
                return get(new URL(resp.headers.location, url)).then(resolve, reject)
            }
            // reject on error status
            if (resp.statusCode < 200 || resp.statusCode >= 300) {
                resp.resume()
                return reject(new Error(`Failed to download from ${URL.parse(url).origin}: ${resp.statusCode} ${resp.statusMessage}`))
            }
            // collect content
            let chunks = []
            resp.on("data", chunk => chunks.push(chunk))
            resp.on("end", () => resolve(Buffer.concat(chunks)))
            resp.on("error", reject)
        }).on("error", reject)
    })
    let data = await get(url)
    // write to a zipped file
    let zipfile = path.join(target, filename);
    fs.writeFileSync(zipfile, data);
    // create temp folder to extract to
    let tmp = fs.mkdtempSync(
        path.join(target, filename.split(".")[0])
    )
    // extract file
    if ([".zip", ".nupkg"].includes(path.extname(zipfile))) {
        // extract zip file (NuGet packages are zip files too)...
        await unzip(zipfile, {
            dir: tmp
        })
    }
    if (path.extname(zipfile) === ".gz") {
        // extract tar.gz file...
        await untar({
            file: zipfile,
            cwd: tmp,
            sync: true
        })
    }
    // if the archive has one top-level folder, use that as the root
    let contents = fs.readdirSync(tmp, { withFileTypes: true })
    let root = contents.length === 1 && contents[0].isDirectory() ? path.join(tmp, contents[0].name) : tmp
    let dest = path.join(target, name ?? path.basename(root))
    // if we weren't given a filename, check for conflicts now that we know the destination folder
    if (!name && !overwrite && hasConflict(dest)) {
        // delete zip file and temp folder
        fs.unlink(zipfile, err => {if (err) throw err})
        fs.rmSync(tmp, { recursive: true, force: true })
        // error
        throw Object.assign(
            new Error(`Could not download ${url} to ${dest} as folder already exists and is not empty.`),
            { code: "EEXIST", path: dest }
        )
    }
    // clear the destination if we're overwriting it, or if it's empty (Windows can't rename onto an existing folder)
    if (fs.existsSync(dest)) {
        fs.rmSync(dest, { recursive: true, force: true })
    }
    // move it into place under the requested name
    fs.renameSync(root, dest)
    // delete zip file and temp folder
    fs.unlink(zipfile, err => {if (err) throw err})
    fs.rmSync(tmp, { recursive: true, force: true })
}


/**
 * IPC handlers for each function, accessible from the renderer as `electron.files.<name>`
 */
export const handlers = {
    load: ipcMain.handle("electron.files.load", (evt, file) => load(file)),
    save: ipcMain.handle("electron.files.save", (evt, file, content) => save(file, content)),
    exists: ipcMain.handle("electron.files.exists", (evt, file) => exists(file)),
    stat: ipcMain.handle("electron.files.stat", (evt, file) => stat(file)),
    mkdir: ipcMain.handle("electron.files.mkdir", (evt, folder, recursive = true) => mkdir(folder, recursive)),
    openDialog: ipcMain.handle("electron.files.openDialog", (evt, options) => openDialog(options, windows[evt.sender.id])),
    saveDialog: ipcMain.handle("electron.files.saveDialog", (evt, options) => saveDialog(options, windows[evt.sender.id])),
    scandir: ipcMain.handle("electron.files.scandir", (evt, root, recursive) => scandir(root, recursive)),
    showItemInFolder: ipcMain.handle("electron.files.showItemInFolder", (evt, folder) => showItemInFolder(folder)),
    openPath: ipcMain.handle("electron.files.openPath", (evt, target) => openPath(target)),
    openExternal: ipcMain.handle("electron.files.openExternal", (evt, url) => openExternal(url)),
    downloadFolder: ipcMain.handle("electron.files.downloadFolder", (evt, url, target, name) => downloadFolder(url, target, name))
}
