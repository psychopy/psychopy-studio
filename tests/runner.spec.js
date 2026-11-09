import { test, expect, openView } from './fixtures.js';

test.describe("Runner", () => {
	/** @type {import('@playwright/test').Page} The page on which to run these tests */
	let page;

	test.beforeAll(async ({ app }) => {
		page = await openView(app, 'runner');
	});

	test.afterAll(async () => {
		await page?.close();
	});

	test("Opens", async () => {
		await expect(page).toHaveTitle(/PsychoPy Runner/);
	});
});
