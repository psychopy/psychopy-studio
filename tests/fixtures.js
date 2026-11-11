import { _electron as electron, test as base, expect } from '@playwright/test';
import { openView, getButtonByRole } from './tools.js';

/**
 * Test object with an `app` fixture, which launches PsychoPy Studio once per worker (without a
 * splash screen) and closes it after all tests in that worker are done.
 */
export const test = base.extend({
	app: [
		async ({}, use) => {
			// setup environment for the app process
			let env = { ...process.env };
			// VSCode (itself Electron) sets this in its terminals, which stops Electron acting as an app
			delete env.ELECTRON_RUN_AS_NODE;
			// mark the app as running in a test (read via `isTest` in electron/src/tools/version.js),
			// which also makes the app use a separate config folder (psychopy4.tests)
			env.PSYCHOPY_TEST = "1";
			// launch the app
			let app = await electron.launch({
				args: ['electron/src/index.cjs'],
				env: env
			});
			// wait for the first window to load
			let window = await app.firstWindow();
			await window.waitForLoadState('domcontentloaded');
			// wait for Python install, if we're reinstalling
			if (env.PSYCHOPY_TEST_CLEAN === "1") {
				// get the Python install message once available
				let pythonMsg = window.getByTestId("setup-python-message")
				// output the Python installation logs
				pythonMsg.getAttribute("data-logs").then(console.log).catch(() => null)
				// check that the resulting message is a success
				await expect(pythonMsg, "Python install failed").toHaveAttribute(
					"data-status", "success", { timeout: 10 * 60_000 }
				)
				// close the Python setup dialog by clicking the OK button
				let pythonDlg = window.getByTestId("setup-python-dlg")
				await getButtonByRole(pythonDlg, "OK").click()
				await expect(pythonDlg).toBeHidden();
			}
			// run tests
			await use(app);
			// close the app
			await app.close();
		},
		// long timeout, as a clean run waits for Python to install
		{ scope: 'worker', timeout: 16 * 60_000 }
	],
	builder: [
		async ({ app }, use) => {
			// open Builder view
			let page = await openView(app, 'builder');
			// check that it opens successfully
			let frame = page.locator("#frame")
			await expect(frame, "Builder frame didn't load").toHaveAttribute("data-testid", "builder");
			// run tests
			await use(page);
			// close Builder view
			await page.close();
		},
		{ scope: 'worker' }
	],
	coder: [
		async ({ app }, use) => {
			// open Coder view
			let page = await openView(app, 'coder');
			// check that it opens successfully
			let frame = page.locator("#frame")
			await expect(frame, "Coder frame didn't load").toHaveAttribute("data-testid", "coder");
			// run tests
			await use(page);
			// close Coder view
			await page.close();
		},
		{ scope: 'worker' }
	],
	runner: [
		async ({ app }, use) => {
			// open Runner view
			let page = await openView(app, 'runner');
			// check that it opens successfully
			let frame = page.locator("#frame")
			await expect(frame, "Runner frame didn't load").toHaveAttribute("data-testid", "runner");
			// run tests
			await use(page);
			// close Runner view
			await page.close();
		},
		{ scope: 'worker' }
	],
});

export { expect };
