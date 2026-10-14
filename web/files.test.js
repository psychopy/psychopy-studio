import assert from "node:assert/strict";
import test from "node:test";

import { createFiles } from "./files.js";

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
