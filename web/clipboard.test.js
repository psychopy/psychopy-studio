import assert from "node:assert/strict";
import test from "node:test";

import { createClipboard } from "./clipboard.js";

test("clipboard initially contains no value", async () => {
    const clipboard = createClipboard();
    assert.equal(await clipboard.get(), undefined);
});

test("clipboard stores structured values", async () => {
    const clipboard = createClipboard();
    const routine = {
        tag: "Routine",
        name: "trial",
        components: [{ tag: "TextComponent" }]
    };

    await clipboard.set(routine);

    assert.deepEqual(await clipboard.get(), routine);
});

test("clipboard replaces its previous value", async () => {
    const clipboard = createClipboard();

    await clipboard.set("first");
    await clipboard.set("second");

    assert.equal(await clipboard.get(), "second");
});
