import assert from "node:assert/strict";
import test from "node:test";

import { createWindows } from "./windows.js";

test("opens a target relative to the document base URL", async () => {
    const calls = [];
    const windowHandle = {};
    const windowObject = {
        open: (...args) => {
            calls.push(args);
            return windowHandle;
        }
    };

    windowObject.self = windowObject;
    windowObject.top = windowObject;
    const windows = createWindows(
        windowObject,
        { baseURI: "https://example.com/psychopy-studio/" }
    );

    assert.equal(await windows.new("builder/"), windowHandle);
    assert.deepEqual(calls, [
        [new URL("https://example.com/psychopy-studio/builder/"), "_blank"]
    ]);
});

test("opens a target inside the current iframe", async () => {
    const calls = [];
    const parentWindow = {};
    const windowObject = {
        location: {
            assign: (url) => calls.push(url)
        }
    };

    windowObject.self = windowObject;
    windowObject.top = parentWindow;
    const windows = createWindows(
        windowObject,
        { baseURI: "https://example.com/psychopy-studio/" }
    );

    assert.equal(await windows.new("builder/"), windowObject);
    assert.deepEqual(calls, [
        new URL("https://example.com/psychopy-studio/builder/")
    ]);
});

test("emits data using the Electron listener signature", () => {
    const windows = createWindows();
    const received = [];

    windows.listen("ready", (event, data) => received.push([event, data]));
    windows.emit("ready", true);

    assert.deepEqual(received, [[undefined, true]]);
});

test("keeps event tags isolated", () => {
    const windows = createWindows();
    const received = [];

    windows.listen("fileOpen", (event, data) => received.push(data));
    windows.emit("ready", true);

    assert.deepEqual(received, []);
});

test("notifies every listener registered for a tag", () => {
    const windows = createWindows();
    const received = [];

    windows.listen("fileOpen", (event, data) => received.push(`first:${data}`));
    windows.listen("fileOpen", (event, data) => received.push(`second:${data}`));
    windows.emit("fileOpen", "experiment.psyexp");

    assert.deepEqual(received, [
        "first:experiment.psyexp",
        "second:experiment.psyexp"
    ]);
});