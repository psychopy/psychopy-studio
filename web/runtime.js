import { electron } from "./preload.js";

export function installWebRuntime(windowObject = globalThis.window) {
  if (!windowObject.electron && !windowObject.web) {
    windowObject.web = electron;
  }
  return windowObject.web || windowObject.electron;
}
