const { ipcRenderer, contextBridge, webUtils } = require('electron');


// details about Electron process
const electron = {
  windows: {
    new: (target) => ipcRenderer.invoke("electron.windows.new", target).then(resp => resp),
    get: (target) => ipcRenderer.invoke("electron.windows.get", target).then(resp => resp),
    send: (id, tag, data) => ipcRenderer.invoke("electron.windows.send", id, tag, data).then(resp => resp),
    emit: (tag, data) => ipcRenderer.send(tag, data),
    listen: (tag, lsnr) => ipcRenderer.on(tag, lsnr),
    focus: (id) => ipcRenderer.invoke("electron.windows.focus", id).then(resp => resp),
    devtools: (id) => ipcRenderer.invoke("electron.windows.devtools", id).then(resp => resp),
    close: (id) => ipcRenderer.invoke("electron.windows.close", id).then(resp => resp),
    hideMenu: () => ipcRenderer.invoke("electron.windows.hideMenu").then(resp => resp),
    setMenu: (template) => ipcRenderer.invoke("electron.windows.setMenu", template).then(resp => resp),
  },
  paths: {
    getPathForFile: (file) => webUtils.getPathForFile(file), 
    documents: () => ipcRenderer.invoke("electron.paths.documents").then(resp => resp),
    user: () => ipcRenderer.invoke("electron.paths.user").then(resp => resp),
    devices: () => ipcRenderer.invoke("electron.paths.devices").then(resp => resp),
    prefs: () => ipcRenderer.invoke("electron.paths.prefs").then(resp => resp),
    pavlovia: {
      dir: () => ipcRenderer.invoke("electron.paths.pavlovia").then(resp => resp),
      users: () => ipcRenderer.invoke("electron.paths.pavlovia.users").then(resp => resp),
      projects: () => ipcRenderer.invoke("electron.paths.pavlovia.projects").then(resp => resp),
    }
  },
  files: {
    load: (file) => ipcRenderer.invoke("electron.files.load", file).then(resp => resp),
    save: (file, content) => ipcRenderer.invoke("electron.files.save", file, content).then(resp => resp),
    exists: (file) => ipcRenderer.invoke("electron.files.exists", file).then(resp => resp),
    stat: (file) => ipcRenderer.invoke("electron.files.stat", file).then(resp => resp),
    mkdir: (path, recursive=true) => ipcRenderer.invoke("electron.files.mkdir", path, recursive).then(resp => resp),
    openDialog: (options) => ipcRenderer.invoke("electron.files.openDialog", options).then(resp => resp),
    saveDialog: (options) => ipcRenderer.invoke("electron.files.saveDialog", options).then(resp => resp),
    scandir: (root) => ipcRenderer.invoke("electron.files.scandir", root).then(resp => resp),
    showItemInFolder: (folder) => ipcRenderer.invoke("electron.files.showItemInFolder", folder),
    openPath: (path) => ipcRenderer.invoke("electron.files.openPath", path),
    openExternal: (url) => ipcRenderer.invoke("electron.files.openExternal", url)
  },
  clipboard: {
    get: () => ipcRenderer.invoke("electron.clipboard.get").then(resp => resp),
    set: (value) => ipcRenderer.invoke("electron.clipboard.set", value).then(resp => resp)
  },
  version: () => ipcRenderer.invoke("electron.version").then(resp => resp),
  platform: () => ipcRenderer.invoke("electron.platform").then(resp => resp),
  quit: () => ipcRenderer.invoke("electron.quit")
};
contextBridge.exposeInMainWorld('electron', electron)

// details about Python process
const python = {
  liaison: {
    start: (venv) => ipcRenderer.invoke("python.liaison.start",venv).then(resp => resp),
    stop: (venv) => ipcRenderer.invoke("python.liaison.stop",venv).then(resp => resp),
    listen: (tag, lsnr) => ipcRenderer.on(`liaison:${tag}`, lsnr),
    send: (venv, message, timeout) => ipcRenderer.invoke("python.liaison.send", venv, message, timeout).then(resp => resp),
    started: (venv) => ipcRenderer.invoke("python.liaison.started", venv).then(resp => resp),
    ready: (venv) => ipcRenderer.invoke("python.liaison.ready", venv).then(resp => resp)
  },
  venv: {
    setup: (venv, prerelease=false) => ipcRenderer.invoke("python.venv.setup", venv, prerelease).then(resp => resp),
    executable: (venv) => ipcRenderer.invoke("python.venv.executable", venv).then(resp => resp),
    installPackage: (venv, name, version=undefined) => ipcRenderer.invoke("python.venv.installPackage", venv, name, version).then(resp => resp),
    uninstallPackage: (venv, name) => ipcRenderer.invoke("python.venv.uninstallPackage", venv, name).then(resp => resp),
    getPackages: (venv) => ipcRenderer.invoke("python.venv.getPackages", venv).then(resp => resp),
    getPackageDetails: (venv, name) => ipcRenderer.invoke("python.venv.getPackageDetails", venv, name).then(resp => resp)
  },
  uv: {
    folder: () => ipcRenderer.invoke("python.uv.folder").then(resp => resp),
    executable: () => ipcRenderer.invoke("python.uv.executable").then(resp => resp),
    exists: () => ipcRenderer.invoke("python.uv.exists").then(resp => resp),
    install: () => ipcRenderer.invoke("python.uv.install").then(resp => resp),
    makeExecutable: (psychopyVersion, pythonVersion) => ipcRenderer.invoke("python.uv.makeExecutable", psychopyVersion, pythonVersion).then(resp => resp),
    findPython: (version) => ipcRenderer.invoke("python.uv.findPython", version).then(resp => resp),
    getEnvironments: () => ipcRenderer.invoke("python.uv.getEnvironments").then(resp => resp),
    output: {
      send: (message) => ipcRenderer.send("uv", message),
      listen: (lsnr) => ipcRenderer.on("uv", lsnr)
    }
  },
  output: {
    stdout: {
      send: (message) => ipcRenderer.send("stdout", message),
      listen: (lsnr) => ipcRenderer.on("stdout", lsnr)
    },
    stderr: {
      send: (message) => ipcRenderer.send("stderr", message),
      listen: (lsnr) => ipcRenderer.on("stderr", lsnr)
    }
  },
  shell: {
    list: (venv) => ipcRenderer.invoke("python.shell.list", venv).then(resp => resp),
    send: (venv, id, msg) => ipcRenderer.invoke("python.shell.send", venv, id, msg).then(resp => resp),
    open: (venv) => ipcRenderer.invoke("python.shell.open", venv).then(resp => resp),
    close: (venv, id) => ipcRenderer.invoke("python.shell.close", venv, id).then(resp => resp)
  },
  scripts: {
    run: (venv, file, ...args) => ipcRenderer.invoke("python.scripts.run", venv, file, ...args).then(resp => resp),
    finished: (venv, id) => ipcRenderer.invoke("python.scripts.finished", venv, id).then(resp => resp),
    stop: (venv, id) => ipcRenderer.invoke("python.scripts.stop", venv, id).then(resp => resp),
  },
  psychojs: {
    run: (cwd, params={}) => ipcRenderer.invoke("python.psychojs.run", cwd, params).then(resp => resp),
    stop: (address) => ipcRenderer.invoke("python.psychojs.stop", address).then(resp => resp),
  }
}
contextBridge.exposeInMainWorld('python', python)

const git = {
  listen: (lsnr) => ipcRenderer.on("git", lsnr),
  output: (message) => ipcRenderer.invoke("git.output", message).then(resp => resp),
  server: () => ipcRenderer.invoke("git.server").then(resp => resp),
  login: () => ipcRenderer.invoke("git.login").then(resp => resp),
  loadUsers: () => ipcRenderer.invoke("git.loadUsers").then(resp => resp),
  clearUsers: () => ipcRenderer.invoke("git.clearUsers").then(resp => resp),
  listUsers: () => ipcRenderer.invoke("git.listUsers").then(resp => resp),
  listGroups: () => ipcRenderer.invoke("git.listGroups").then(resp => resp),
  getUserInfo: (username) => ipcRenderer.invoke("git.getUserInfo", username).then(resp => resp),
  getRemote: (folder, user) => ipcRenderer.invoke("git.getRemote", folder, user).then(resp => resp),
  getProjectInfo: (group, name, username) => ipcRenderer.invoke("git.getProjectInfo", group, name, username).then(resp => resp),
  pull: (folder, user, force=true) => ipcRenderer.invoke("git.pull", folder, user, force).then(resp => resp),
  stage: (folder) => ipcRenderer.invoke("git.stage", folder).then(resp => resp),
  commit: (message, folder, user) => ipcRenderer.invoke("git.commit", message, folder, user).then(resp => resp),
  push: (folder, user, force=false) => ipcRenderer.invoke("git.push", folder, user, force).then(resp => resp),
  newProject: (details, folder, user) => ipcRenderer.invoke("git.newProject", details, folder, user).then(resp => resp)
}
contextBridge.exposeInMainWorld('git', git)