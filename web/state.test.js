import assert from "node:assert/strict";
import test from "node:test";

import { createState } from "./state.js";

test("reads cached profiles synchronously and updates them asynchronously", async () => {
    const state = createState();
    const components = { TextComponent: { name: "Text" } };

    assert.deepEqual(state.getProfiles(), {});
    await state.setProfiles("components", components);
    assert.deepEqual(state.getProfiles(), { components });
    assert.deepEqual(createState().getProfiles(), {});
});

test("merges partial frame updates", async () => {
    const frame = { view: "builder", files: [] };
    const state = createState(frame);

    await state.updateFrame({ files: ["experiment.psyexp"] });

    assert.deepEqual(frame, {
        view: "builder",
        files: ["experiment.psyexp"]
    });
});

test("keeps fields omitted from later updates", async () => {
    const frame = {};
    const state = createState(frame);

    await state.updateFrame({ view: "builder" });
    await state.updateFrame({ files: ["experiment.psyexp"] });

    assert.deepEqual(frame, {
        view: "builder",
        files: ["experiment.psyexp"]
    });
});

test("keeps frame instances isolated", async () => {
    const firstFrame = {};
    const secondFrame = {};
    const firstState = createState(firstFrame);

    await firstState.updateFrame({ view: "builder" });

    assert.deepEqual(firstFrame, { view: "builder" });
    assert.deepEqual(secondFrame, {});
});
