import { test, expect, openView } from './fixtures.js';

test.describe('Core', () => {
	test('app opens a window', async ({ app }) => {
		let window = await app.firstWindow();
		await expect(window).toHaveTitle(/PsychoPy/);
	});

	test('no splash screen with --no-splash', async ({ app }) => {
		// every open window should be a view served by Svelte, not the splash page
		for (let window of app.windows()) {
			expect(window.url()).toMatch(/^http:\/\//);
		}
	});

	test('preload exposes electron API', async ({ app }) => {
		let window = await app.firstWindow();
		let version = await window.evaluate(() => electron.version());
		expect(version).toBeTruthy();
	});

	test('app knows it is running in a test', async ({ app }) => {
		let window = await app.firstWindow();
		expect(await window.evaluate(() => electron.isTest())).toBe(true);
	});

	for (let [target, title] of [
		['builder', 'PsychoPy Builder'],
		['coder', 'PsychoPy Coder'],
		['runner', 'PsychoPy Runner']
	]) {
		test(`can open ${target}`, async ({ app }) => {
			let page = await openView(app, target);
			await expect(page).toHaveTitle(new RegExp(title));
			await page.close();
		});
	}
});
