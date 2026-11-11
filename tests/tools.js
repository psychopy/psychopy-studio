import { expect as _expect } from '@playwright/test';


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
 * Get a button by its action
 * 
 * @param {import('@playwright/test').Locator} parent Parent element containing the button
 * @param {string} action Action of the button to get
 * 
 * @returns {import('@playwright/test').Locator} Locator corresponding to the button
 */
export function getButtonByAction(parent, action) {
	return parent.locator(`button[data-action="${action}"]`)
}


// extensions to playwright's expect...
let expect = _expect


/**
 * Confirm that a given window is a given view
 * 
 * @param {import('@playwright/test').Page} page Page to check
 * @param {string} target Name of the view to check for
 * @param {{ timeout?: number }} options Options passed to the underlying assertion
 */
expect = expect.extend({
	async toBeView(page, target, options) {
		// construct profile for this check's result
		let result = {
			name: "toBeView",
			pass: undefined,
			expected: target,
			actual: undefined,
			message: () => this.utils.matcherHint(
					"toBeView", undefined, undefined, { isNot: this.isNot }
				)
				+ `\n\n`
				+ `Expected window ${this.isNot ? "not " : ""}to be view: ${this.utils.printExpected(target)}`
				+ (result.actual ? `\nReceived: ${this.utils.printReceived(result.actual)}` : "")
		}
		// do check...
		try {
			// wait for page to load
			await page.waitForLoadState("domcontentloaded")
			// confirm that it's the correct view
			let expectation = _expect( page.locator("#frame") )
			// respect .not argument
			if (this.isNot) {
				expectation = expectation.not
			}
			// look for the target in frame's testid
			await expectation.toHaveAttribute("data-testid", target, options)
			// if nothing's errored, update result to be a pass
			result.pass = true
		} catch (err) {
			// if the above fails, update result to be a fail
			result.pass = false
			// include actual result
			result.actual = err.matcherResult?.actual
		}		
		// flip pass if we're expecting not
		if (this.isNot) result.pass = !result.pass

		return result
	}
})


export { expect };
