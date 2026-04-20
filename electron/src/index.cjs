const path = require('node:path');
const fs = require("fs");
const proc = require("child_process");
const { app, dialog, BrowserWindow, ipcMain, shell, Menu, MenuItem } = require('electron');

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
const { default: test } = require('node:test');

var svelte = {
  address: {
    host: "localhost",
    port: 8003,
  },
  process: undefined
};
var windows = {
  splash: undefined
};

// redirect app gubbins to a subfolder so it's distinct from user data
app.setPath("userData", path.join(app.getPath("appData"), "psychopy4", ".node"))

// load prefs from a JSON (if there is one)
let prefsFile = path.join(app.getPath("appData"), "psychopy4", "preferences.json");
let prefs
if (fs.existsSync(prefsFile)) {
  prefs = JSON.parse(
    fs.readFileSync(prefsFile)
  )
} else {
  prefs = {}
}

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
  if (file.endsWith(".psyexp")) {
    // open psyexp in Builder
    newWindow(`builder?fileOpen=${file}`, true, false)
  } else if (startFile.endsWith(".psyrun")) {
    // open psyrun in Runner
    newWindow(`runner?fileOpen=${file}`, true, false)
  } else {
    // log anything else and leave default
    logging.error(`Requested file is not a PsychoPy file (.psyexp or .psyrun): ${process.argv[1]}`)
  }
}
app.on("open-file", onFileOpen)

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

  // keep track of ready statuses
  let ready = {
    svelte: Promise.withResolvers()
  }
  // if on windows, get frame to open with from argv
  if (process.platform === "win32") {
    onFileOpen(undefined, process.argv[isDev ? 2 : 1])
  }
  // start timers 
  let mintime = new Promise((resolve, reject) => setTimeout(resolve, prefs.params?.showSplash?.val !== "False" ? 1000 : 0));
  let maxtime = new Promise((resolve, reject) => setTimeout(resolve, 10000));
  // start the svelte side of things
  if (isDev) {
    // use Vite dev server for development
    logging.log(`Starting Vite dev server at ${svelte.address.host}:${svelte.address.port}`)
    svelte.process = proc.exec(`vite dev --host=${svelte.address.host} --port=${svelte.address.port}`);
    svelte.process.stdout.on("data", msg => {
      // look for ready message
      let readyMatch = msg.match(
        /➜  Local:   http:\/\/(?<host>[\w\d]+):(?<port>[\w\d]+)/
      )
      // if this is it...
      if (readyMatch) {
        // store final host and port
        svelte.address.host = readyMatch.groups.host
        svelte.address.port = readyMatch.groups.port
        // mark as ready
        ready.svelte.resolve()
        // log
        logging.log(
          `Started Vite dev server at ${svelte.address.host}:${svelte.address.port}`
        )
      }
    })
  } else {
    // log run args
    logging.log(`Running: ${process.argv.join(" | ")}`)
    // use express to serve static files in production
    const express = require('express');
    const app = express();

    app.use(express.static(path.join(__dirname, '../../dist')));

    // API routes
    app.get('/api/plugins', async (req, res) => {
      try {
        const response = await fetch('https://psychopy.org/plugins.json');
        const data = await response.json();
        res.json(data);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    app.post('/api/report', express.json(), async (req, res) => {
      try {
        const snapshot = req.body;
        const response = await fetch("https://api.clickup.com/api/v2/list/128673336/task", {
          method: "POST",
          headers: {
            "Authorization": snapshot.token,
            "Accept": "application/json",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name: snapshot.title,
            description: snapshot.description,
            priority: snapshot.priority,
            custom_fields: [
              { id: "1cc82c18-79c6-470b-aa63-b39a108afe90", value: ["39244b7f-eea7-47d2-8760-418d86dc525d"] },
              { id: "90ee49a2-01ce-49be-a3bb-c7b12160eb03", value: snapshot.email },
              { id: "e649173f-4f1a-4275-abff-1e699962eda1", value: snapshot.version.match(/(?<=\w+)\d+$/)?.[0] || "" }
            ]
          })
        });
        const data = await response.json();

        for (let [name, content] of [
          ["last_app_load.log", snapshot.logs.app],
          ["liaison.log", snapshot.logs.liaison],
          ["context.json", JSON.stringify(snapshot.context, undefined, 4)]
        ]) {
          await fetch(`https://api.clickup.com/api/v2/task/${data.id}/comment`, {
            method: "POST",
            headers: {
              "Authorization": snapshot.token,
              "Accept": "application/json",
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              notify_all: false,
              comment_text: `${name}\n---\n${content}\n`
            })
          });
        }

        res.json(data);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    app.get('/api/surveys', async (req, res) => {
      try {
        const response = await fetch(`https://pavlovia.org/api/v2/surveys?oauthToken=${req.headers.access}`);
        const data = await response.json();
        res.json(data);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Handle SPA fallback without wildcard
    app.use((req, res) => {
      res.sendFile(path.join(__dirname, '../../dist/index.html'));
    });

    const server = app.listen(svelte.address.port, svelte.address.host, () => {
      logging.log(`Started static server at ${svelte.address.host}:${svelte.address.port}`)
      ready.svelte.resolve();
    });

    svelte.process = { kill: () => server.close() };
  }

  // show when Svelte has loaded and min time has been reached, or when max time has been reached
  Promise.any([
    Promise.all([
      mintime,
      ...Object.values(ready).map(val => val.promise)
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
  try {
    targets = JSON.parse(prefs.params?.defaultView?.val)
  } catch {
    targets = ["builder"]
  }
  for (let target of targets) {
    newWindow(target, true, false).then(
      // show tips if requested
      id => windows[id].webContents.send(
        "showTips", prefs.params?.showStartupTips?.val === "True"
      )
    )
  }
}


async function newWindow(target = null, show = true, fullscreen = false) {
  // create window
  let win = new BrowserWindow({
    icon: favicon,
    width: 1600,
    height: 900,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });
  // prevent default key behaviour for CMD+R
  win.webContents.on("before-input-event", (evt, input) => {
    if (input.modifiers.includes("meta") && input.key.toLowerCase() === "r") {
      evt.preventDefault()
    }
  })
  // open new windows in browser unless opened by electron
  win.webContents.setWindowOpenHandler(
    ({ url }) => {
      shell.openExternal(url);

      return { action: 'deny' }
    }
  )

  // load target URL
  let url = `http://${svelte.address.host}:${svelte.address.port}/${target || ''}`;
  logging.log(`Loading ${url}...`)
  win.loadURL(url);
  // store handle against id
  windows[win.webContents.id] = win;
  // create promise waiting for ready event
  let ready = Promise.withResolvers()
  // show when ready (if requested)
  if (show) {
    // show once ready, if requested
    win.once("ready-to-show", evt => {
      logging.log(`Loaded ${url}`)
      win.show();
      // fulscreen if requested
      if (fullscreen) {
        win.maximize();
      }
      // give focus
      win.focus();
      // make sure the splash screen is closed
      if (!windows.splash.isDestroyed()) {
        windows.splash.close()
      }
      // show dev tools if debugging
      if (prefs?.params?.debugMode?.val === "True") {
        win.webContents.openDevTools();
      }
    })
    // return ID once ready message is received (has to be sent via electron.windows.emit)
    win.webContents.on("ipc-message", (evt, tag) => {
      if (tag === "ready") {
        ready.resolve(win.webContents.id)
      }
    })
  } else {
    // if not showing, return ID once ready to show
    win.once("ready-to-show", evt => ready.resolve(win.webContents.id))
  }
  // wait until ready
  return await ready.promise
}


/**
 * Create a menu from template received from the frontend
 * 
 * @param {array} template Same as for Menu.buildFromTemplate, but with a frontend callback ID 
 * rather than a function for `click` attributes
 */
function setMenu(win, template) {
  function setupCallback(entry) {
    if (entry.click) {
      // click callbacks are supplied from the frontend as an ID
      let id = entry.click;
      // create a function which sends this ID back to the frontend to call a function
      entry.click = evt => {
        win.webContents.send(
          `menu:${id}`, true
        )
      }
    }
    // iterate through submenu items
    if (entry.submenu) {
      for (let subentry of entry.submenu) {
        // recur
        setupCallback(subentry)
      } 
    }
  }

  // setup callbacks for items
  for (let entry of template) {
    setupCallback(entry)
  }
  // create menu from template
  let menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
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
// make sure the Svelte process is killed on exit
process.on('SIGINT', app.quit);
process.on('SIGTERM', app.quit);
app.on("quit", (evt, code) => {
  // close svelte
  svelte.process.kill(0);
})


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
  git: gitHandlers
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
