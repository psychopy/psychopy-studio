import { app } from "electron";

export const appVersion = app.isPackaged ? app.getVersion() : "dev";

export const isDev = !app.isPackaged;
