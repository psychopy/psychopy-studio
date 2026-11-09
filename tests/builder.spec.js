import { test, expect, openView } from './fixtures.js';

test.describe("Builder", () => {
	/** @type {import('@playwright/test').Page} The page on which to run these tests */
	let page;

	test.beforeAll(async ({ app }) => {
		page = await openView(app, 'builder');
	});

	test.afterAll(async () => {
		await page?.close();
	});

	test("Opens", async () => {
		await expect(page).toHaveTitle(/PsychoPy Builder/);
	});
});
