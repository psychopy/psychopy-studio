import assert from "node:assert/strict";
import test from "node:test";

import { getPlatform } from "./platform.js";

const cases = [
    ["Windows", "win32"],
    ["macOS", "darwin"],
    ["iPhone", "darwin"],
    ["Linux x86_64", "linux"],
    ["Android", "linux"],
    ["Chrome OS", "linux"],
];

for (const [browserPlatform, expected] of cases) {
    test(`maps ${browserPlatform} to ${expected}`, async () => {
        assert.equal(await getPlatform({ platform: browserPlatform }), expected);
    });
}

test("prefers userAgentData platform", async () => {
    const navigatorObject = {
        platform: "Linux x86_64",
        userAgentData: { platform: "Windows" }
    };

    assert.equal(await getPlatform(navigatorObject), "win32");
});

test("returns unknown when platform information is unavailable", async () => {
    assert.equal(await getPlatform({}), "unknown");
});
