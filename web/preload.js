import { createClipboard } from "./clipboard";
import { createSystem } from "./system";
import { createFiles } from "./files";
import { getPlatform } from "./platform";
import { createWindows } from "./windows";

const files = createFiles();
const windows = createWindows();

/**
 * Treat this file as a hitlist for functions which the web-only version of PsychoPy Studio should expose to the front-end. 
 * These are all the same functions and arguments as can be found in electron/preload.js, so for a webview to work it should 
 * implement each of these functions and expose them to the frontend via objects with this structure.
 */



export const electron = {
  windows: {
    new: (target) => {},
    get: (target) => {},
    send: (id, tag, data) => {},
    emit: (tag, data) => windows.emit,
    listen: (tag, lsnr) => windows.listen,
    focus: (id) => {},
    devtools: (id) => {},
    close: (id) => {},
    hideMenu: () => {},
    setMenu: (template) => {},
  },
  paths: {
    getPathForFile: (file) => {}, 
    documents: () => {},
    user: () => {},
    devices: () => {},
    prefs: () => {},
    pavlovia: {
      dir: () => {},
      users: () => {},
      projects: () => {},
    }
  },
  files: {
    load: (file) => {},
    save: (file, content) => {},
    exists: (file) => {},
    stat: (file) => {},
    mkdir: (path, recursive=true) => {},
    openDialog: (options) => {},
    saveDialog: (options) => {},
    scandir: (root) => {},
    showItemInFolder: (folder) => {},
    openPath: (path) => {},
    openExternal: (url) => files.openExternal,
    downloadFolder: (url, target, name) => {}
  },
  clipboard: createClipboard(),
  state: {
    updateFrame: (details) => {}
  },
  system: createSystem(),
  version: () => {},
  platform: getPlatform,
  quit: () => {}
};

// details about Python process
export const python = {
  liaison: {
    start: (venv) => {},
    stop: (venv) => {},
    listen: (tag, lsnr) => {},
    send: (venv, message, timeout) => {},
    started: (venv) => {},
    ready: (venv) => {}
  },
  venv: {
    setup: (venv, prerelease=false) => {},
    executable: (venv) => {},
    installPackage: (venv, name, version=undefined) => {},
    uninstallPackage: (venv, name) => {},
    getPackages: (venv) => {},
    getPackageDetails: (venv, name) => {},
    hasGIL: (venv) => {}
  },
  uv: {
    folder: () => {},
    executable: () => {},
    systemInfo: () => {},
    exists: () => {},
    needsUpdate: () => {},
    resolvePackageVersion: (version, pipname) => {},
    findDirectory: (option) => {},
    setDirectory: (option) => {},
    install: () => {},
    makeExecutable: (psychopyVersion, pythonVersion) => {},
    findPython: (version) => {},
    getEnvironments: () => {},
    output: {
      send: (message) => {},
      listen: (lsnr) => {}
    }
  },
  output: {
    stdout: {
      send: (message) => {},
      listen: (lsnr) => {}
    },
    stderr: {
      send: (message) => {},
      listen: (lsnr) => {}
    }
  },
  shell: {
    list: (venv) => {},
    send: (venv, id, msg) => {},
    open: (venv) => {},
    close: (venv, id) => {}
  },
  scripts: {
    run: (venv, file, ...args) => {},
    wait: (venv, id) => {},
    stop: (venv, id) => {},
  },
  psychojs: {
    run: (cwd, params={}) => {},
    stop: (address) => {},
  }
}

export const git = {
  listen: (lsnr) => {},
  output: (message) => {},
  server: () => {},
  login: () => {},
  loadUsers: () => {},
  clearUsers: () => {},
  listUsers: () => {},
  listGroups: (username) => {},
  listSurveys: (username) => {},
  getUserInfo: (username) => {},
  authenticateURL: (url, username) => {},
  getRemote: (folder, user) => {},
  getProjectInfo: (details, username) => {},
  clone: (details, username) => {},
  fork: (details, username) => {},
  listProjectForks: (project, username) => {},
  pull: (folder, user, force=true) => {},
  stage: (folder) => {},
  commit: (message, folder, user) => {},
  push: (folder, user, force=false) => {},
  newProject: (details, folder, user) => {},
  loadProjects: () => {},
  linkProject: (key, folder) => {},
}
