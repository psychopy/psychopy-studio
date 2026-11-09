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
				args: ['electron/src/index.cjs', '--no-splash'],
				env: env
			});
			// wait for the first window to load
			let window = await app.firstWindow();
			await window.waitForLoadState('domcontentloaded');
			// run tests
			await use(app);
			// close the app
			await app.close();
		},
		{ scope: 'worker', timeout: 60_000 }
	]
});

export { expect };
