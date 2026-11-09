import { test, expect, openView } from './fixtures.js';

test.describe('Runner', () => {
	/** @type {import('@playwright/test').Page} */
	let page;

	test.beforeAll(async ({ app }) => {
		page = await openView(app, 'runner');
	});

	test.afterAll(async () => {
		await page?.close();
	});

	test('opens', async () => {
		await expect(page).toHaveTitle(/PsychoPy Runner/);
	});
});
