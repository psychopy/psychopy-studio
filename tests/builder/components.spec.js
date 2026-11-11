import { test } from "../fixtures.js";
import { expect, openView, getButtonByAction } from '../tools.js';


test.describe("Builder Components/Standalone Routines", () => {
    // Builder view showing a new experiment, closed after these tests
    let page

    test.beforeAll(async ({ app, builder }) => {
        // start listening for a new window
        let prom = app.waitForEvent("window")
        // click the ribbon button to create a new window
        let newBtn = getButtonByAction(builder.locator("#ribbon"), "new");
        await newBtn.click();
        // assign it to `page` when one appears
        page = await prom
        // wait for Components to load in from Python
        let collapsed = page.locator("#components .components button[data-testclass=component-category]:not(.active)")
        await expect(collapsed.first()).toBeVisible({ timeout: 60_000 })
        // expand all categories so buttons are visible
        while (await collapsed.count()) {
            await collapsed.first().click()
        }
    })

    test.afterAll(async () => {
        // close page when we're done
        await page.close()
    })

    
    test("Add every Component / Standalone Routine", async () => {
        // get all buttons in the Components panel
        let buttons = page.locator("#components .components button:not([data-testclass=component-category])")
        // confirm that there are some
        await expect(buttons.first(), "No Component buttons found").toBeVisible()
        // iterate over Component buttons...
        for (let btn of await buttons.and(page.locator("button[data-testclass=component]")).all()) {
            // get class of Component
            let cls = await btn.innerText()
            // add a test step for adding this Component
            await test.step(`Add ${cls}`, async () => {
                // click the button
                await btn.click()
                // get the resulting dialog and its OK button
                let dlg = page.getByTestId("new-component")
                let okBtn = getButtonByAction(dlg, "OK")
                // the OK button should always start off enabled
                await expect(okBtn, `${cls} Component shouldn't start off invalid`).not.toBeDisabled()
                // get the name
                let name = await dlg.locator("input#name").inputValue()
                // press OK to add the Component
                await okBtn.click()
                // get the corresponding node in the Routine canvas
                let canvas = await page.locator(".routine-canvas").first()
                let node = await canvas.locator(`#${name}`)
                // is there a node for it?
                await expect(node, `No node in Routine Canvas for ${name} (${cls})`).toBeAttached()
            })
        }
        // iterate over Standalone Routine buttons...
        for (let btn of await buttons.and(page.locator("[data-testclass=routine]")).all()) {
            // get class of Standalone Routine
            let cls = await btn.innerText()
            // add a test step for adding this Routine
            await test.step(`Add ${cls}`, async () => {
                // click the button
                await btn.click()
                // get new Routine's name
                let name = await page.locator("#routines-notebook input#name").first().inputValue()
                // get Routine tab labels
                let tabs = page.locator("#routines-notebook .notebook-tabs button[role=tab] span.label")
                // is the new Routine in there?
                await expect.poll(
                    () => tabs.allInnerTexts(),
                    { message: `No tab in Routines notebook for ${name} (${cls})` }
                ).toContain(name)
            })
        }
    })
})
