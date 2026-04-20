import { app, ipcMain, safeStorage } from "electron";
import git from "isomorphic-git";
import logging from "./logging.js";
import http from "isomorphic-git/http/node";
import fs from "node:fs";
import path from "node:path";
import { BrowserWindow } from "electron";
import { randint, randof } from "./tools/random.js";
import { favicon } from "./resources.js";


// set server URL and client ID
const server = "https://gitlab.pavlovia.org"
const client = "944b87ee0e6b4f510881d6f6bc082f64c7bba17d305efdb829e6e0e7ed466b34"


class User {
    

    constructor({
        token: token, 
        profile: profile
    }={}) {
        this.token = token
        this.profile = profile
    }

    /**
     * Refresh profile information for this user
     */
    async refreshProfile() {
        // fetch profile from Pavlovia
        this.profile = await fetch(
            `${server}/api/v4/user?access_token=${await this.getToken()}`
        ).then(
            resp => resp.json()
        );
        // save users JSON
        saveUsers()
    }

    /**
     * Refresh the authentication token for this user
     */
    async refreshToken() {
        // send refresh request
        let data = await fetch(`${server}/oauth/token`, {
            method: "POST",
            body: JSON.stringify({
                client_id: client,
                refresh_token: this.token.refresh,
                grant_type: "refresh_token",
                redirect_uri: server,
            }),
            headers: { "Content-type": "application/json; charset=UTF-8" }
        }).then(
            resp => resp.json()
        );
        // store response
        if (data.access_token && data.refresh_token) {
            this.token.access = data.access_token;
            this.token.refresh = data.refresh_token;
            this.token.expired = false
        } else {
            throw new Error(data.message || 'Token refresh failed');
        }
        // save users JSON
        saveUsers()
        // mark token as expired after timeout
        setTimeout(
            evt => this.token.expired = true, 
            data.expires_in * 1000
        )

        return data;
    }

    /**
     * Get the access token for this user, will refresh if needed
     * 
     * @returns {string} Access token
     */
    async getToken() {
        // if expired, refresh
        if (this.token.expired) {
            await this.refreshToken(username)
        }

        return this.token.access
    }
}


// object storing authentication info for users against their username
var users = {};


/**
 * Login as a new user
 */
async function login() {
    // generate state and verifier
    let state = String(crypto.randomUUID());
    let verifier = Array.from(
        { length: randint(44, 127) },
        () => randof("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._~")
    ).join("");
    // create a hash from verifier (via SHA-256 digestion)
    let hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
    // decode hash to make challenge
    let challenge = btoa(String.fromCharCode(...new Uint8Array(hash)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '')
    ;
    // construct auth url
    let url = `${server}/oauth/authorize?${new URLSearchParams({
        client_id: client,
        redirect_uri: server,
        response_type: "code",
        state: state,
        code_challenge: challenge,
        code_challenge_method: "S256"
    }).toString()}`;
    // create authentication window
    let win = new BrowserWindow({
        icon: favicon,
        width: 980,
        height: 720,
        show: true
    });
    win.removeMenu();
    // clear all storage data to force fresh login
    await win.webContents.session.clearStorageData({
        storages: ['cookies', 'localstorage', 'sessionstorage', 'cachestorage', 'websql', 'indexdb']
    });
    // load auth url
    win.loadURL(url);
    // promise to wait for user to log in
    let code
    try {
        code = await new Promise((resolve, reject) => {
            // if window closes before promise is resolved, reject promise
            win.on("close", reject)
            // on navigate, resolve if we have a code
            win.webContents.on("did-navigate", (evt, url) => {
                // search the URL for the auth code
                let params = new URLSearchParams(
                    url.replace(/https:\/\/.*?(?=\?)/, "")
                )
                // if we got one...
                if (params.get("code")) {
                    // resolve the promise
                    resolve(
                        params.get("code")
                    )
                    // remove close handler
                    win.removeListener('close', reject)
                    // close the window
                    win.close()
                }
            })
        })
    } catch {
        // if cancelled by user, return harmlessly
        return
    }
    // get tokens from code
    let data = await fetch(`${server}/oauth/token`, {
        method: "POST",
        body: JSON.stringify({
            client_id: client,
            code: code,
            grant_type: "authorization_code",
            redirect_uri: server,
            code_verifier: verifier
        }),
        headers: { "Content-type": "application/json; charset=UTF-8" }
    }).then(
        resp => resp.json()
    )
    // create user
    let user = new User({
        token: {
            access: data.access_token,
            refresh: data.refresh_token,
            verifier: verifier
        }
    })
    // mark token as expired after timeout
    setTimeout(
        evt => user.token.expired = true, 
        data.expires_in * 1000
    )
    // get username
    await user.refreshProfile()
    // store user
    users[user.profile.username] = user
    // save users JSON
    saveUsers()

    return user.profile.username
}


/**
 * Load users from the JSON file in the user folder
 */
export async function loadUsers() {
    // get path to pavlovia users file
    let folder = path.join(app.getPath("appData"), "psychopy4", "pavlovia")
    let file = path.join(folder, "users.json")
    // make sure it exists
    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder, { recursive: true })
    }
    if (!fs.existsSync(file)) {
        fs.writeFileSync(file, JSON.stringify({}))
    }
    // read file (decrypt if possible)
    let content
    if (safeStorage.isEncryptionAvailable()) {
        content = safeStorage.decryptString(
            fs.readFileSync(file)
        )
    } else {
        content = fs.readFileSync(file, { encoding: 'utf8' })
    }
    // parse as JSON
    let data = JSON.parse(content)
    // create a User object for each entry
    for (let [username, { token, profile }] of Object.entries(data)) {
        try {
            // create object
            let user = new User({
                token: token,
                profile: profile
            })
            // refresh profile and token
            await user.refreshToken()
            await user.refreshProfile()
            // store user if this worked
            users[username] = user
        } catch (err) {
            console.error(`Failed to load user ${username} from file`)
            console.error(err)
        }
    }
    // refreshing tokens will have invalidated old ones, so save over stored data
    saveUsers()
}


/**
 * Save users to the JSON file in the user folder
 */
export function saveUsers() {
    // create basic object for output
    let output = {}
    // iterate through all users
    for (let [username, user] of Object.entries(users)) {
        // create output for each
        output[username] = {
            token: {
                access: user.token.access,
                refresh: user.token.refresh,
            },
            profile: user.profile
        }
    }
    // get path to pavlovia users file
    let folder = path.join(app.getPath("appData"), "psychopy4", "pavlovia")
    let file = path.join(folder, "users.json")
    // make sure folder exists
    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder, { recursive: true })
    }
    // save file (encrypt if possible)
    let content = JSON.stringify(output, undefined, 4)
    if (safeStorage.isEncryptionAvailable()) {
        content = safeStorage.encryptString(content)
    }
    // write output
    fs.writeFileSync(file, content)
}


/**
 * Clear saved information on all users
 */
export function clearUsers() {
    // clear users dict
    users = {}
    // save
    saveUsers()
}


export async function listGroups() {
    // create URL
    let url = new URL(`${server}/api/v4/groups`)
    // apply auth
    if (username && username in users) {
        url.searchParams.set(
            "access_token", 
            await users[username].getToken()
        )
    }
    // get groups
    return await fetch(
        url.toString()
    ).then(
        resp => resp.json()
    ).then(
        resp => resp?.[0]
    )
}


export async function newProject(details, folder, username) {
    // initialise local repo
    await git.init({ 
        fs, 
        dir: folder 
    })
    // add remote
    await git.addRemote({
        fs,
        dir: folder,
        remote: "origin",
        url: `${server}/${details.group}/${details.name}.git`
    })
    // stage and commit all local files
    await stage(folder)
    await commit("Create project", folder, username)
    // push (to create project)
    await push(folder, username)

    return {
        name: details.name,
        group: details.group,
        local: folder,
        remote: await git.getConfig({
            fs,
            dir: folder,
            path: "remote.origin.url"
        })
    }
}

/**
 * Make sure a local git repo is compatible with isomorphic git
 * 
 * @param {string} folder Folder containing the repo
 */
async function sanitize(folder) {
    // get remote url
    let url = await git.getConfig({
        fs,
        dir: folder,
        path: "remote.origin.url"
    })
    // if there is no URL, there's nothing to sanitize
    if (!url) {
        return
    }
    // make sure it ends with .git
    if (!url.endsWith(".git")) {
        await git.setConfig({
            fs,
            dir: folder,
            path: "remote.origin.url",
            value: url + ".git"
        })
    }
}


export async function getRemote(folder, username=undefined) {
    // sanitize remote
    sanitize(folder)
    // get raw remote from config
    let remote = await git.getConfig({
        fs,
        dir: folder,
        path: "remote.origin.url"
    })
    // if no remote, return null
    if (!remote) {
        return null
    }
    // parse to a URL
    let url = new URL(remote)
    // apply auth
    if (username && username in users) {
        url.username = "oauth2"
        url.password = await users[username].getToken()
    }

    return url.toString()
}


/**
 * Get information about the given project
 * 
 * @param {*} group 
 * @param {*} name 
 */
export async function getProjectInfo({
    group: group,
    name: name,
    folder: folder
}, username) {
    // if given a folder, get group and name from that
    if (folder && (!group || !name)) {
        let remote = new URL(
            await getRemote(folder, username)
        )
        let parts = remote.pathname.match(/\/(?<group>.+?)\/(?<name>.+?)\.git/).groups
        group = parts.group
        name = parts.name
    }
    // if no group or name, abort
    if (!group || !name) {
        return
    }
    // create search url
    let url = new URL(`https://gitlab.pavlovia.org/api/v4/users/${group}/projects?search=${name}`)
    // apply auth
    if (username && username in users) {
        url.searchParams.set(
            "access_token", 
            await users[username].getToken()
        )
    }
    // search for project
    return await fetch(
        url.toString()
    ).then(
        resp => resp.json()
    ).then(
        resp => resp?.[0]
    )
}


export async function pull(folder, username, force=true) {
    // log
    output(`Getting changes from online...`)
    // get auth token
    let token = await users[username].getToken()
    // fetch changes
    await git.fetch({
        fs,
        http,
        dir: folder,
        remote: "origin",
        author: {
            name: users[username].profile.name,
            email: users[username].profile.email
        },
        onAuth: evt => { 
            return { username: "oauth2", password: token } 
        },
        onMessage: output
    })
    // checkout latest
    await git.checkout({
        fs,
        dir: folder,
        force: force
    })
    output(`Finished getting changes.`)
}


export async function stage(folder) {
    // log
    output(`Scanning for local changes...`)
    // track changed files
    let changed = []
    // iterate through files
    for (let file of fs.globSync("**/*.*", { cwd: folder })) {
        // get file status
        let status = await git.status({
            fs,
            dir: folder,
            filepath: file
        })
        // skip if gitignored or unchanged
        if (["ignored", "unmodified", "*unmodified"].includes(status)) {
            continue
        }
        // stage
        await git.add({
            fs, 
            dir: folder, 
            filepath: file,
            onMessage: output
        })
        // note change
        changed.push(file)
    }
    // log changes
    if (changed.length) {
        output(`${changed.length} files changed:\n${changed.join("\n")}`)
    } else {
        output("No files changed.")
    }

    return changed
}


export async function commit(message, folder, username) {
    // make commit with message
    let sha = await git.commit({
        fs,
        dir: folder,
        message: message || "No message",
        author: {
            name: users[username].profile.name,
            email: users[username].profile.email
        }
    })
    // log
    output(`Committed changes: "${message}" (${sha})`)

    return sha
}


export async function push(folder, username, force=false) {
    // log
    output(`Sending changes to Pavlovia...`)
    // get auth token
    let token = await users[username].getToken()
    // push
    await git.push({
        fs,
        http,
        dir: folder,
        remote: "origin",
        onAuth: evt => { 
            return {username: "oauth2", password: token} 
        },
        force: force,
        onMessage: output
    })
}


export function output(message) {
    // if given a buffer, decode it
    if (message instanceof Buffer) {
        message = decoder.decode(message)
    }
    // log message
    logging.log(message, "GIT")
    // emit event
    BrowserWindow.getAllWindows().forEach(
        win => win.webContents.send("git", message)
    )
}


export const handlers = {
    output: ipcMain.handle("git.output", (evt, message) => output(message)),
    server: ipcMain.handle("git.server", (evt) => server),
    login: ipcMain.handle("git.login", (evt) => login()),
    loadUsers: ipcMain.handle("git.loadUsers", (evt) => loadUsers()),
    clearUsers: ipcMain.handle("git.clearUsers", (evt) => clearUsers()),
    listUsers: ipcMain.handle("git.listUsers", (evt) => Object.keys(users)),
    listGroups: ipcMain.handle("git.listGroups", (evt) => listGroups()),
    getUserInfo: ipcMain.handle("git.getUserInfo", (evt, username) => users[username]?.profile),
    getRemote: ipcMain.handle("git.getRemote", (evt, folder, user) => getRemote(folder, user)),
    getProjectInfo: ipcMain.handle("git.getProjectInfo", (evt, group, name, username) => getProjectInfo(group, name, username)),
    pull: ipcMain.handle("git.pull", (evt, folder, user, force=true) => pull(folder, user, force)),
    stage: ipcMain.handle("git.stage", (evt, folder) => stage(folder)),
    commit: ipcMain.handle("git.commit", (evt, message, folder, user) => commit(message, folder, user)),
    push: ipcMain.handle("git.push", (evt, folder, user, force=false) => push(folder, user, force)),
    newProject: ipcMain.handle("git.newProject", (evt, details, folder, user) => newProject(details, folder, user))
}