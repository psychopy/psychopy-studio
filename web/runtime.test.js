import assert from "node:assert/strict";
import test from "node:test";

import { electron } from "./preload.js";
import { installWebRuntime } from "./runtime.js";

test("installs the web adapter when Electron is unavailable", () => {
    const windowObject = {};

    assert.equal(installWebRuntime(windowObject), electron);
    assert.equal(windowObject.web, electron);
    assert.equal(windowObject.electron, undefined);
});

test("does not replace an existing web adapter", () => {
    const existing = {};
    const windowObject = { web: existing };

    assert.equal(installWebRuntime(windowObject), existing);
    assert.equal(windowObject.web, existing);
});

test("does not overwrite Electron's adapter", () => {
    const existing = {};
    const windowObject = { electron: existing };

    assert.equal(installWebRuntime(windowObject), existing);
    assert.equal(windowObject.electron, existing);
    assert.equal(windowObject.web, undefined);
});
