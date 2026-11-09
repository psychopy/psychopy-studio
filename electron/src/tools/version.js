import { app } from "electron";

export const appVersion = app.isPackaged ? app.getVersion() : "dev";

export const isDev = !app.isPackaged;

// are we running inside the test suite? (set by tests/fixtures.js)
export const isTest = process.env.PSYCHOPY_TEST === "1";
