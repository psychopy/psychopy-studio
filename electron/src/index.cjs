const path = require('node:path');
const fs = require("fs");
const proc = require("child_process");
const { app, dialog, BrowserWindow, ipcMain, shell } = require('electron');

// make sure psychopy4 folder exists before importing subpackages
if (!fs.existsSync(path.join(app.getPath("appData"), "psychopy4"))) {
  fs.mkdirSync(
    path.join(app.getPath("appData"), "psychopy4")
  )
}

const { handlers: pythonHandlers } = require("./python");
const { handlers: gitHandlers } = require("./git.js")
const logging = require("./logging.js");
const { UsageReport } = require("./usage.js");
const { favicon } = require("./resources.js");
const { appVersion, isDev } = require('./version.js');
const { handlers: stateHandlers, lastState, newFrame, updateFrame, saveState } = require('./state.js');
const { windows, newWindow, setMenu } = require("./frames.js");
const { details: svelte, startSvelte } = require("./svelte.js");
const { prefs, prefsFile } = require("./preferences.js");
const { default: test } = require('node:test');

// get a single-instance lock
const lock = app.requestSingleInstanceLock()

// redirect app gubbins to a subfolder so it's distinct from user data
app.setPath("userData", path.join(app.getPath("appData"), "psychopy4", ".node"))

// setup a clipboard
clipboard = undefined

// send usage stats
let usageReport = new UsageReport()
usageReport.send()

// setup listener for file open
function onFileOpen(evt, file) {
  if (!file) {
    // do nothing if no file
    return
  }
  if (file.startsWith("pavlovia://")) {
    params = file.match(/pavlovia\:\/\/(?<group>.*?)\/(?<name>.*?)$/).groups
    newWindow(`runner?projectOpen=${params.group}/${params.name}`, true, false, [800, 600])
  } else if (file.endsWith(".psyexp")) {
    // open psyexp in Builder
    newWindow(`builder?fileOpen=${file}`, true, false)
  } else if (file.endsWith(".psyrun")) {
    // open psyrun in Runner
    newWindow(`runner?fileOpen=${file}`, true, false)
  } else {
    // log anything else and leave default
    logging.error(`Requested file is not a PsychoPy file (.psyexp or .psyrun): ${process.argv[1]}`)
  }
}
app.on("open-file", onFileOpen)

// mark self as default opener for URI links
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('pavlovia', process.execPath, [path.resolve(process.argv[1])])
  }
} else {
  app.setAsDefaultProtocolClient('pavlovia')
}
// handle when a second instance is created via URI
if (!lock) {
  app.quit()
} else {
  if (process.platform === "darwin") {
    app.on('open-url', (evt, url) => onFileOpen(evt, url))
  } else {
    app.on('second-instance', (evt, cmd, cd) => onFileOpen(evt, cmd.pop()) )
  }
}

var started = false

const createWindow = () => {
  // if app is already running...
  if (started) {
    // open start windows and do nothing else
    startingWindows()
    return
  }
  // mark started
  started = true
  // create splash
  windows.splash = new BrowserWindow({
    icon: favicon,
    title: "PsychoPy Studio",
    width: 720,
    height: 400,
    show: false,
    transparent: true,
    frame: false,
    alwaysOnTop: true
  });
  windows.splash.loadFile(path.join(__dirname, 'splash.html'));
  windows.splash.center();
  if (prefs.params?.showSplash?.val !== "False") {
    // only show if requested via prefs
    windows.splash.show();
  }

  // start svelte
  let startedSvelte = startSvelte()
  // start timers so that we have a min time to show the splash and a max time to stop waiting for Svelte
  let mintime = new Promise((resolve, reject) => setTimeout(
    resolve, 
    prefs.params?.showSplash?.val !== "False" ? 1000 : 0)
  );
  let maxtime = new Promise((resolve, reject) => setTimeout(
    resolve, 
    10000
  ));
  // show when Svelte has loaded and min time has been reached, or when max time has been reached
  Promise.any([
    Promise.all([
      mintime,
      startedSvelte
    ]),
    maxtime
  ]).then(
    () => {
      // make sure at least one window is open
      if (!Object.keys(windows).filter(key => key !== "splash").length) {
        startingWindows()
      }
    }
  )
};


/**
 * Open the default starting windows indicated by prefs
 */
function startingWindows() {
  let targets
  // get starting windows from prefs
  try {
    targets = JSON.parse(prefs.params?.defaultView?.val)
  } catch {
    targets = ["builder"]
  }
  // if given a launch arg, ignore prefs
  if ( ["--builder", "-b"].includes(process.argv[isDev ? 2 : 1]) ) {
    targets = ["builder"]
  } else if ( ["--coder", "-c"].includes(process.argv[isDev ? 2 : 1]) ) {
    targets = ["coder"]
  } else if ( ["--runner", "-r"].includes(process.argv[isDev ? 2 : 1]) ) {
    targets = ["runner"]
  } else if (process.argv[isDev ? 2 : 1] && process.platform === "win32") {
    // if on windows, file to open may have been passed via args
    onFileOpen(undefined, process.argv[isDev ? 2 : 1])
    return
  }
  // open starting windows
  for (let target of targets) {
    // get previous states for this target
    let states = Object.values(lastState.frames).filter(
      item => item.view === target
    )
    // if no previous states, make a fresh one
    if (!states.length) {
      states.push({
        pos: [null, null],
        size: [null, null],
        maximized: false,
        files: [],
        view: target
      })
    }
    // create window(s)
    for (let state of states) {
      newWindow(
        state.files.length ? `${state.view}?fileOpen=${state.files}` : state.view, 
        true, 
        state.maximized
      ).then(id => {
        // restore size and pos
        if (state.size.every(item => item !== null)) {
          windows[id].setSize(...state.size)
        }
        if (state.pos.every(item => item !== null)) {
          windows[id].setPosition(...state.pos)
        }
        windows[id].setMax
        // show tips if requested
        windows[id].webContents.send(
          "showTips", prefs.params?.showStartupTips?.val === "True"
        )
      })
    }
    
  }
}


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
process.on('SIGINT', app.quit);
process.on('SIGTERM', app.quit);
// save app state before closing windows on quit
app.on("before-quit", (evt, code) => saveState());
// make sure the Svelte process is killed on exit
app.on("quit", (evt, code) => svelte.process?.kill?.(0));


/* handlers which can be invoked by electron */

const handlers = {
  electron: {
    windows: {
      new: ipcMain.handle("electron.windows.new", async (evt, target) => await newWindow(target)),
      get: ipcMain.handle("electron.windows.get", (evt, target) => Object.keys(windows).filter(
        id => !windows[id].isDestroyed()
      ).filter(
        id => String(windows[id].webContents.getURL()).includes(target)
      )),
      send: ipcMain.handle("electron.windows.send", (evt, id, tag, data) => windows[id].webContents.send(tag, data)),
      focus: ipcMain.handle("electron.windows.focus", (evt, id) => windows[id || evt.sender.id].focus()),
      devtools: ipcMain.handle("electron.windows.devtools", (evt, id) => windows[id || evt.sender.id].openDevTools()),
      close: ipcMain.handle("electron.windows.close", (evt, id) => windows[id || evt.sender.id].close()),
      hideMenu: ipcMain.handle("electron.windows.hideMenu", (evt) => windows[evt.sender.id].removeMenu()),
      setMenu: ipcMain.handle("electron.windows.setMenu", (evt, template) => setMenu(windows[evt.sender.id], template))
    },
    paths: {
      documents: ipcMain.handle("electron.paths.documents", (evt) => app.getPath("documents")),
      user: ipcMain.handle("electron.paths.user", (evt) => path.join(app.getPath("appData"), "psychopy4")),
      devices: ipcMain.handle("electron.paths.devices", (evt) => path.join(app.getPath("appData"), "psychopy4", "devices.json")),
      prefs: ipcMain.handle("electron.paths.prefs", (evt) => prefsFile),
      pavlovia: {
        dir: ipcMain.handle("electron.paths.pavlovia", (evt) => path.join(app.getPath("appData"), "psychopy4", "pavlovia")),
        users: ipcMain.handle("electron.paths.pavlovia.users", (evt) => path.join(app.getPath("appData"), "psychopy4", "pavlovia", "users.json")),
        projects: ipcMain.handle("electron.paths.pavlovia.projects", (evt) => path.join(app.getPath("appData"), "psychopy4", "pavlovia", "projects.json")),
      }
    },
    files: {
      load: ipcMain.handle("electron.files.load", (evt, file) => fs.readFileSync(file, { encoding: 'utf8' })),
      save: ipcMain.handle("electron.files.save", (evt, file, content) => fs.writeFileSync(file, content, { encoding: 'utf8', mode: 0o777 })),
      exists: ipcMain.handle("electron.files.exists", (evt, file) => fs.existsSync(file)),
      stat: ipcMain.handle("electron.files.stat", (evt, file) => {
        let stat = fs.statSync(file)
        return Object.assign({
          isDirectory: stat.isDirectory(),
          isFile: stat.isFile()
        }, stat)
      }),
      mkdir: ipcMain.handle("electron.files.mkdir", (evt, path, recursive = true) => fs.mkdirSync(path, { recursive: recursive })),
      openDialog: ipcMain.handle("electron.files.openDialog", (evt, options) => dialog.showOpenDialogSync(windows[evt.sender.id], options)),
      saveDialog: ipcMain.handle("electron.files.saveDialog", (evt, options) => dialog.showSaveDialogSync(windows[evt.sender.id], options)),
      scandir: ipcMain.handle("electron.files.scandir", (evt, root, recursive) => fs.readdirSync(root, { recursive: recursive }).sort(
        (a, b) => fs.statSync(path.join(root, b)).isDirectory() - fs.statSync(path.join(root, a)).isDirectory()
      )),
      showItemInFolder: ipcMain.handle("electron.files.showItemInFolder", (evt, folder) => shell.showItemInFolder(folder)),
      openPath: ipcMain.handle("electron.files.openPath", (evt, path) => shell.openPath(path)),
      openExternal: ipcMain.handle("electron.files.openExternal", (evt, url) => shell.openExternal(url))
    },
    clipboard: {
      get: ipcMain.handle("electron.clipboard.get", (evt) => clipboard),
      set: ipcMain.handle("electron.clipboard.set", (evt, value) => clipboard = value)
    },
    version: ipcMain.handle("electron.version", (evt) => appVersion),
    platform: ipcMain.handle("electron.platform", (evt) => process.platform),
    quit: ipcMain.handle("electron.quit", (evt) => app.quit())
  },
  python: pythonHandlers,
  git: gitHandlers,
  state: stateHandlers
};

// make sure user folder exists
if (!fs.existsSync(
  path.join(app.getPath("appData"), "psychopy4")
)) {
  fs.mkdirSync(
    path.join(app.getPath("appData"), "psychopy4"),
    { recursive: true }
  )
}
