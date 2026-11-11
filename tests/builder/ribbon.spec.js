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

    test("New file", async ({ app }) => {
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

    test("Undo/redo", async () => {
        // get the undo and redo buttons
        let undoBtn = getButtonByAction(ribbon, "undo");
        let redoBtn = getButtonByAction(ribbon, "redo");
        // get the indicator on the piloting toggle
        let indicator = getButtonByAction(ribbon, "togglePiloting").locator(".indicator");
        // click the piloting toggle so that the experiment has a change
        await clickBtn("togglePiloting");
        // undo should be enabled, and redo disabled
        await expect(undoBtn).not.toBeDisabled();
        await expect(redoBtn).toBeDisabled();
        // get the value of the toggle button
        let finishedLeft = await indicator.evaluate(el => el.classList.contains("left"));
        // click the undo button
        await clickBtn("undo");
        // the piloting toggle should now have flipped (as the previous toggle is undone)
        if (finishedLeft) {
            await expect(indicator).not.toContainClass("left");
        } else {
            await expect(indicator).toContainClass("left");
        }
        // redo should be enabled
        await expect(redoBtn).not.toBeDisabled();
        // click the redo button
        await clickBtn("redo");
        // the piloting toggle should now have flipped (as the previous toggle is redone)
        if (finishedLeft) {
            await expect(indicator).toContainClass("left");
        } else {
            await expect(indicator).not.toContainClass("left");
        }
        // undo should once again be enabled, and redo disabled
        await expect(undoBtn).not.toBeDisabled();
        await expect(redoBtn).toBeDisabled();
    })

    test("Toggle piloting", async () => {
        // get the indicator on the switch button
        let indicator = getButtonByAction(ribbon, "togglePiloting").locator(".indicator");
        // get the value of the toggle button
        let startedLeft = await indicator.evaluate(el => el.classList.contains("left"));
        // click the piloting toggle
        await clickBtn("togglePiloting");
        // has its value changed?
        if (startedLeft) {
            await expect(indicator).not.toContainClass("left");
        } else {
            await expect(indicator).toContainClass("left");
        }
    })
});