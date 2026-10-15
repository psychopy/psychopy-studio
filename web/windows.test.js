import assert from "node:assert/strict";
import test from "node:test";

import { createWindows } from "./windows.js";

test("opens a target relative to the document base URL", async () => {
    const calls = [];
    const windowHandle = {};
    const windows = createWindows(
        {
            open: (...args) => {
                calls.push(args);
                return windowHandle;
            }
        },
        { baseURI: "https://example.com/psychopy-studio/" }
    );

    assert.equal(await windows.new("builder/"), windowHandle);
    assert.deepEqual(calls, [
        [new URL("https://example.com/psychopy-studio/builder/"), "_blank"]
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