import { app, ipcMain } from "electron";
import { uv } from "./uv.js";
import { venvs, getVenv } from "./venv.js";
import { Liaison, getLiaison } from "./liaison.js";
import { PythonShell } from "./shell.js";
import { PythonScript } from "./script.js";
import { PsychoJSServer, getPsychoJSServer } from "./psychojs.js";


// make sure all Python instances are killed on quit
app.on("quit", (evt, code) => {
  // close python
  for (let venv of Object.values(venvs)) {
    venv.killAll()
  }
})
// register all Python handlers
export const handlers = {
    liaison: {
        start: ipcMain.handle("python.liaison.start", async (evt, venv) => (await getLiaison(venv)).start()),
        stop: ipcMain.handle("python.liaison.stop", async (evt, venv) => (await getLiaison(venv)).stop()),
        send: ipcMain.handle("python.liaison.send", async (evt, venv, message, timeout) => (await getLiaison(venv)).send(message, timeout)),
        started: ipcMain.handle("python.liaison.started", async (evt, venv) => (await getLiaison(venv)).started),
        ready: ipcMain.handle("python.liaison.ready", async (evt, venv) => await (await getLiaison(venv)).ready.promise)
    },
    venv: {
        setup: ipcMain.handle("python.venv.setup", async (evt, venv, prerelease=false) => (await getVenv(venv)).setup(prerelease)),
        executable: ipcMain.handle("python.venv.executable", async (evt, venv) => (await getVenv(venv)).executable),
        installPackage: ipcMain.handle("python.venv.installPackage", async (evt, venv, name, version=undefined) => (await getVenv(venv)).installPackage(name, version)),
        uninstallPackage: ipcMain.handle("python.venv.uninstallPackage", async (evt, venv, name) => (await getVenv(venv)).uninstallPackage(name)),
        getPackages: ipcMain.handle("python.venv.getPackages", async (evt, venv) => (await getVenv(venv)).getPackages()),
        getPackageDetails: ipcMain.handle("python.venv.getPackageDetails", async (evt, venv, name) => (await getVenv(venv)).getPackageDetails(name))
    },
    uv: {
        folder: ipcMain.handle("python.uv.folder", (evt) => uv.folder),
        executable: ipcMain.handle("python.uv.executable", (evt) => uv.executable),
        findDirectory: ipcMain.handle("python.uv.findDirectory", (evt, option) => uv.findDirectory(option)),
        setDirectory: ipcMain.handle("python.uv.setDirectory", (evt, option) => uv.setDirectory(option)),
        exists: ipcMain.handle("python.uv.exists", (evt) => uv.exists()),
        install: ipcMain.handle("python.uv.install", (evt) => uv.install()),
        makeExecutable: ipcMain.handle("python.uv.makeExecutable", (evt, psychopyVersion, pythonVersion) => uv.makeExecutable(psychopyVersion, pythonVersion)),
        findPython: ipcMain.handle("python.uv.findPython", (evt, version) => uv.findPython(version)),
        getEnvironments: ipcMain.handle("python.uv.getEnvironments", (evt) => uv.getEnvironments())
    },
    shell: {
        list: ipcMain.handle("python.shell.list", async (evt, venv) => Object.keys((await getVenv(venv)).shells)),
        send: ipcMain.handle("python.shell.send", async (evt, venv, id, msg) => (await getVenv(venv)).shells[id].send(msg)),
        open: ipcMain.handle("python.shell.open", async (evt, venv) => {
            let shell = new PythonShell(await getVenv(venv))
            shell.start()

            return shell.id
        }),
        close: ipcMain.handle("python.shell.close", async (evt, venv, id) => (await getVenv(venv)).shells[id].close())
    },
    scripts: {
        run: ipcMain.handle("python.scripts.run", async (evt, venv, file, ...args) => {
            let script = new PythonScript(await getVenv(venv), file, args);
            script.start()

            return script.id
        }),
        finished: ipcMain.handle("python.scripts.finished", async (evt, venv, id) => await (await getVenv(venv)).scripts[id].finished.promise),
        stop: ipcMain.handle("python.scripts.stop", async (evt, venv, id) => (await getVenv(venv)).scripts[id].stop())
    },
    psychojs: {
        run: ipcMain.handle("python.psychojs.run", async (evt, cwd, params={}) => await PsychoJSServer.run(cwd, params)),
        stop: ipcMain.handle("python.psychojs.stop", (evt, address) => getPsychoJSServer(address).stop()),
    }
}