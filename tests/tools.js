/**
 * Open a view (builder, coder, runner) in a new window and return its Page
 *
 * @param {import('@playwright/test').ElectronApplication} app The running app
 * @param {string} target Name of the view to open
 * @returns {Promise<import('@playwright/test').Page>}
 */
export async function openView(app, target) {
	// note which windows are already open
	let before = new Set(app.windows());
	// use any open window to ask Electron for a new one (resolves once the new window emits "ready")
	await app.windows()[0].evaluate(
		target => electron.windows.new(target),
		target
	);
	// find the new window (by elimination, as several windows may share a URL)
	let page = app.windows().find(win => !before.has(win));
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
