import { app } from "electron";
import fs from "fs";
import path from "node:path";

// define prefs file
export const prefsFile = path.join(
    app.getPath("appData"), "psychopy4", "preferences.json"
);

// load prefs from a JSON (if there is one)
export var prefs
if (fs.existsSync(prefsFile)) {
    prefs = JSON.parse(
        fs.readFileSync(prefsFile)
    )
} else {
    prefs = {}
}