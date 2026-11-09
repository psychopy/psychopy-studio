import { _electron as electron, test as base, expect } from '@playwright/test';

/**
 * Open a view (builder, coder, runner) in a new window and return its Page
 *
 * @param {import('@playwright/test').ElectronApplication} app The running app
 * @param {string} target Name of the view to open
 * @returns {Promise<import('@playwright/test').Page>}
 */
export async function openView(app, target) {
	// use any open window to ask Electron for a new one (resolves once the new window emits "ready")
	let id = await app.windows()[0].evaluate(
		target => electron.windows.new(target),
		target
	);
	// find the page belonging to the new window
	let page = await app.evaluate(
		({ webContents }, id) => webContents.fromId(id).getURL(),
		id
	).then(
		url => app.windows().find(win => win.url() === url)
	);
	await page.waitForLoadState('domcontentloaded');

	return page;
}

/**
 * Get a dialog button by its role
 * 
 * @param {import('@playwright/test').Locator} dlg Dialog containing the button
 * @param {"OK"|"APPLY"|"CANCEL"|"YES"|"NO"|"HELP"} role Role of the button to get
 * 
 * @returns {import('@playwright/test').Locator} Locator corresponding to the button
 */
export function getButtonByRole(dlg, role) {
	return dlg.locator(`button[data-role="${role}"]`)
}


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
		{ scope: 'worker', timeout: 60_000 }
	]
});

export { expect };
