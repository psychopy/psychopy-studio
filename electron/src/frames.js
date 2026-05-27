import path from "node:path";
import fs from "fs";
import proc from "child_process";
import { BrowserWindow, Menu, shell } from "electron";
import logging from "./logging.js";
import { favicon } from "./resources.js";
import { details as svelte } from "./svelte.js";
import { prefs } from "./preferences.js";
import state from "./state.js";


// store window objects against their ID
export var windows = {
  splash: undefined
};
// store menus for each window against the window's ID
export var menus = {
  splash: undefined
}


export async function newWindow(target = null, show = true, fullscreen = false) {
  // create window
  let win = new BrowserWindow({
    icon: favicon,
    width: 1600,
    height: 900,
    show: false,
    webPreferences: {
      preload: path.join(import.meta.dirname, 'preload.js')
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
  // on mac, we have to setup menu to update on focus (Windows and Linux windows have their own menu)
  if (process.platform === "darwin") {
    win.on("focus", evt => {
      if (menus[win.webContents.id]) {
        Menu.setApplicationMenu(menus[win.webContents.id])
      }
    })
  }
  

  // load target URL
  let url = new URL(`http://${svelte.address.host}:${svelte.address.port}/${target || ''}`);
  logging.log(`Loading ${url}...`)
  win.loadURL(url.toString());
  // store handle against id
  windows[win.webContents.id] = win;
  // create new entry in states
  state.newFrame(
    win.webContents.id,
    url.pathname.split("/")[1]
  )
  // track size and pos of window
  win.on("resize", evt => state.updateFrame(win.webContents.id, { size: win.getSize() }))
  win.on("move", evt => state.updateFrame(win.webContents.id, { pos: win.getPosition() }))
  win.on("maximize", evt => state.updateFrame(win.webContents.id, { maximized: true }))
  win.on("maximize", evt => state.updateFrame(win.webContents.id, { maximized: true }))
  // track when window closes
  win.on("close", evt => state.closeFrame(win.webContents.id))
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
export function setMenu(win, template) {
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
  menus[win.webContents.id] = Menu.buildFromTemplate(template)
  // apply to the current window
  if (process.platform === "darwin") {
    // on Mac, menu has to be set for the whole application when the window gains focus, so set now 
    // if window has focus, otherwise will set when window gets focus
    if (win.isFocused()) {
      Menu.setApplicationMenu(menus[win.webContents.id])
    }
  } else {
    win.setMenu(menus[win.webContents.id])
  }
}