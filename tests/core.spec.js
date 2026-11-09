import { test, expect, openView } from './fixtures.js';

test.describe('Core', () => {
	test('app opens a window', async ({ app }) => {
		let window = await app.firstWindow();
		await expect(window).toHaveTitle(/PsychoPy/);
	});

	test('python install succeeds', async ({ app }) => {
		// allow up to 10 minutes for the whole test (Python install can take a while on a slow VM)
		test.setTimeout(10 * 60_000);
		// get whatever window is open (any will trigger a Python install)
		let window = await app.firstWindow();
		// get the Python install message once available
		let msg = window.getByTestId("setup-python-message")
		// output the Python installation logs
		msg.getAttribute("data-logs").then(console.log).catch(() => null)
		// check that the resulting message is a success
		await expect(msg, "Python install failed").toHaveAttribute(
			"data-status", "success", { timeout: 10 * 60_000 }
		)
		// close the dialog by clicking the OK button
		let dlg = window.getByTestId("setup-python-dlg");
		let okBtn = dlg.locator('button[data-role="OK"]')
		await okBtn.click()
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
