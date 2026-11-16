import path from "node:path";
import fs from "node:fs";
import { test } from "../fixtures.js";
import { getButtonByAction, expect, assetsDir } from "../tools.js";
import { stubDialog } from "electron-playwright-helpers";


test.describe("Coder outline panel", () => {
    // make the outline tree element available to all tests
    let tree;
    // get the assets folder for these tests
    let assets = path.join(assetsDir, "coder", "outline");
    
    test.beforeAll(async ({ coder }) => {
        // make sure the Outline tab is selected
        let tab = await coder.locator("#outline-page")
        await tab.click();
        // get outline tree
        tree = await coder.locator("#outline-tree");
        await expect(tree).toBeAttached()
    });

    /**
     * Use the Open File ribbon button to open a file
     * 
     * @param {import('@playwright/test').ElectronApplication} app Electron app handle from fixtures
     * @param {import('@playwright/test').Page} coder Coder window handle from fixtures
     * @param {string} file File to open
     */
    async function openFile(app, coder, file) {
        // create stub to return the given file when an openDialog is triggered
        await stubDialog(
            app,
            "showOpenDialogSync",
            [file]
        )
        // get the ribbon
        let ribbon = coder.locator("#ribbon")
        // click the open file button
        let btn = await getButtonByAction(ribbon, "open")
        await btn.click()
        // get the editor notebook
        let notebook = coder.locator("#editor-notebook")
        // confirm that it has a page for the newly opened file
        let page = notebook.locator(`.notebook-tab[data-file="${file.replaceAll("\\", "/")}"]`)
        await expect(page, `No page found after opening file "${file}"`).toBeAttached()
    }

    /**
     * Convert a tree of nodes from the outline panel into a JSON object, with the format:
     * {
     *  <branch/node id, from `data-testid`>: {
     *      testClass: <branch/node type, from `data-testclass`>
     *      children: <child nodes, if it's a branch>
     *  }
     * }
     *
     * Closed branches are clicked open, as their children aren't rendered otherwise.
     *
     * @param {import('@playwright/test').Locator} parent Element whose direct children are the
     * branches/nodes to convert (defaults to the whole outline tree)
     * @returns {Promise<object>} JSON representation of the tree
     */
    async function tree2json(parent = tree) {
        let output = {}
        // iterate through direct children (each is either a branch or a node)
        for (let child of await parent.locator(":scope > .tree-branch, :scope > .tree-node").all()) {
            // get node name and type
            let testId = await child.getAttribute("data-testid")
            let testClass = await child.getAttribute("data-testclass")
            if (await child.evaluate(el => el.classList.contains("tree-branch"))) {
                // children are only rendered when the branch is open, so open it if needed
                let nodes = child.locator(":scope > .tree-branch-nodes")
                if (!await nodes.count()) {
                    await child.locator(":scope > .tree-node").click()
                    await expect(nodes, `Branch "${testId}" didn't open`).toBeAttached()
                }
                // recur into children
                output[testId] = {
                    testClass: testClass,
                    children: await tree2json(nodes)
                }
            } else {
                output[testId] = {
                    testClass: testClass
                }
            }
        }

        return output
    }
    
    // iterate through example files
    for (let entry of fs.readdirSync(path.join(assets, "files"), { withFileTypes: true })) {
        test(`Check outline of ${entry.name}`, async ({ app, coder }) => {
            // open file from test assets
            await openFile(app, coder, path.join(assets, "files", entry.name))
            // wait for the file content to load and be parsed into the outline
            await expect(
                tree.locator(":scope > .tree-branch"),
                "Outline wasn't populated"
            ).toBeAttached()
            // get the resulting outline panel as a JSON
            let structure = await tree2json();
            // load the corresponding correct answer (JSON file with the same name in `expected`)
            let expected = JSON.parse(
                fs.readFileSync(
                    path.join(assets, "expected", `${path.parse(entry.name).name}.json`),
                    "utf8"
                )
            )
            // assert that the outline matches what it should
            expect(structure, "Outline doesn't match expected structure").toEqual(expected)
        });
    }
})