import assert from "node:assert/strict";
import test from "node:test";

import { createGit } from "./git.js";

test("starts with no locally linked Pavlovia projects", async () => {
    const git = createGit();

    assert.deepEqual(await git.loadProjects(), []);
});

test("starts without a Pavlovia user", async () => {
    const git = createGit();

    assert.deepEqual(await git.loadUsers(), []);
    assert.deepEqual(await git.listUsers(), []);
    assert.equal(await git.getUserInfo(undefined), undefined);
    assert.equal(await git.getProjectInfo({ folder: "" }, undefined), undefined);
    assert.equal(await git.clearUsers(), undefined);
});