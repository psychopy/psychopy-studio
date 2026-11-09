import { test, expect, openView } from './fixtures.js';

test.describe('Core', () => {
	/** @type {import('@playwright/test').Page} The page on which to run these tests*/
	let page;

	test.beforeAll(async ({ app }) => {
		page = await app.firstWindow();
	});

	test.afterAll(async () => {
		await page?.close();
	});

	test("Electron API available to frontend", async ({ app }) => {
		// check that the simplest electron function returns something sensible
		let version = await page.evaluate(() => electron.version());
		expect(version).toBeTruthy();
	});

	test("Python API available to frontend", async ({ app }) => {
		// check that the simplest electron function returns something sensible
		let version = await page.evaluate(() => python.liaison.send("app", {
			command: "get",
			args: ["psychopy:__version__"]
		}));
		expect(version).toBeTruthy();
	});

	test("No splash screen", async ({ app }) => {
		// every open window should be a view served by Svelte, not the splash page
		for (let window of app.windows()) {
			expect(window.url()).toMatch(/^http:\/\//);
		}
	});

	test("App knows it's running in a test", async ({ app }) => {
		// confirm that the page can evaluate isTest correctly
		expect(await page.evaluate(() => electron.isTest())).toBe(true);
	});
});
