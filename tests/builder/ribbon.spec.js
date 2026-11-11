import { test } from "../fixtures.js";
import { getButtonByAction, expect } from "../tools.js";


test.describe("Builder ribbon", () => {
    // make the ribbon element available to all tests
    let ribbon;
    
    test.beforeAll(async ({ builder }) => {
		// use the window opened at startup (shared with other tests, so not closed afterwards)
		ribbon = await builder.locator("#ribbon");
	});

    /**
     * Helper function to click a button with the given action
     * 
     * @param {string} action Action of the button to click
     */
    async function clickBtn(action) {
        // get the ribbon button
        let btn = getButtonByAction(ribbon, action);
        // make sure it exists
        expect(btn).toBeAttached();
        // click it
        return btn.click();
    }

    test("New button", async ({ app }) => {
        // start listening for a new window
        let newWindowPromise = app.waitForEvent("window");
        // click the ribbon button
        await clickBtn("new");
        // wait until the window opens
        let newWindow = await newWindowPromise;
        // confirm that it's a Builder window
        await expect(newWindow).toBeView("builder");
        // close window
        await newWindow.close();
	});
});