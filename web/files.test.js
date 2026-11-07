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

test("opens a browser file using the Electron path contract", async () => {
    const pickerCalls = [];
    const handle = {
        name: "experiment.psyexp",
        getFile: async () => ({ text: async () => "<PsychoPy2experiment />" })
    };
    const files = createFiles({
        showOpenFilePicker: async (options) => {
            pickerCalls.push(options);
            return [handle];
        }
    });

    assert.deepEqual(await files.openDialog({
        properties: ["openFile"],
        filters: [
            { name: "PsychoPy Experiments", extensions: ["psyexp"] },
            { name: "All Files", extensions: ["*"] }
        ]
    }), ["experiment.psyexp"]);

    assert.equal(await files.load("experiment.psyexp"), "<PsychoPy2experiment />");
    assert.deepEqual(pickerCalls, [{
        multiple: false,
        types: [{
            description: "PsychoPy Experiments",
            accept: { "application/octet-stream": [".psyexp"] }
        }]
    }]);
});

test("saves content through a selected browser file handle", async () => {
    const writes = [];
    const handle = {
        name: "experiment.psyexp",
        createWritable: async () => ({
            write: async (content) => writes.push(content),
            close: async () => writes.push("closed")
        })
    };

    const files = createFiles({
        showSaveFilePicker: async () => handle
    });

    assert.equal(await files.saveDialog({
        defaultPath: "/projects/experiment.psyexp",
        filters: [{ name: "PsychoPy Experiments", extensions: ["psyexp"] }]
    }), "experiment.psyexp");

    await files.save("experiment.psyexp", "<psychopy2experiment />");

    assert.deepEqual(writes, ["<psychopy2experiment />", "closed"]);
});

test("returns undefined when a browser file dialog is cancelled", async () => {
    const files = createFiles({
        showOpenFilePicker: async () => { throw new Error("cancelled"); },
        showSaveFilePicker: async () => { throw new Error("cancelled"); }
    });

    assert.equal(await files.openDialog(), undefined);
    assert.equal(await files.saveDialog(), undefined);
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
test("falls back to fetching bundled content when a file is not stored", async () => {
  const fetchCalls = [];
  const files = createFiles({
    localStorage: createStorage(),
    fetch: async (url) => {
      fetchCalls.push(url);
      if (url === "/examples/reaction_time.psyexp") {
        return { ok: true, text: async () => "<PsychoPy2experiment />" };
      }
      return { ok: false };
    }
  });

  assert.equal(
    await files.load("/examples/reaction_time.psyexp"),
    "<PsychoPy2experiment />"
  );
  // relative paths are resolved against the site root
  assert.equal(
    await files.load("examples/reaction_time.psyexp"),
    "<PsychoPy2experiment />"
  );
  // missing content falls back to null
  assert.equal(await files.load("missing.psyexp"), null);
  assert.deepEqual(fetchCalls, [
    "/examples/reaction_time.psyexp",
    "/examples/reaction_time.psyexp",
    "/missing.psyexp"
  ]);
});

test("prefers stored content over fetching bundled content", async () => {
  const files = createFiles({
    localStorage: createStorage(),
    fetch: async () => {
      throw new Error("should not fetch");
    }
  });

  await files.save("experiment.psyexp", "<stored />");
  assert.equal(await files.load("experiment.psyexp"), "<stored />");
});

test("returns null when fetching bundled content fails", async () => {
  const files = createFiles({
    fetch: async () => {
      throw new Error("network down");
    }
  });

  assert.equal(await files.load("examples/reaction_time.psyexp"), null);
});
