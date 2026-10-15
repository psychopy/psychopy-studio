import assert from "node:assert/strict";
import test from "node:test";

import { createFiles } from "./files.js";

function createStorage() {
    const values = new Map();
    return {
        getItem: (key) => values.get(key) ?? null,
        setItem: (key, value) => values.set(key, String(value))
    };
}

test("stores and loads browser files through local storage", async () => {
    const files = createFiles({ localStorage: createStorage() });

    assert.equal(await files.exists("psychopy/preferences.json"), false);
    await files.save("psychopy/preferences.json", '{"theme":"light"}');
    assert.equal(await files.exists("psychopy/preferences.json"), true);
    assert.equal(
        await files.load("psychopy/preferences.json"),
        '{"theme":"light"}'
    );
});

test("opens external URLs in an isolated tab", async () => {
    const calls = [];
    const windowHandle = {};
    const files = createFiles({
        open: (...args) => {
            calls.push(args);
            return windowHandle;
        }
    });

    assert.equal(await files.openExternal("https://example.com"), windowHandle);
    assert.deepEqual(calls, [
        ["https://example.com", "_blank", "noopener,noreferrer"]
    ]);
});

test("reports a blocked popup as null", async () => {
    const files = createFiles({ open: () => null });

    assert.equal(await files.openExternal("https://example.com"), null);
});
