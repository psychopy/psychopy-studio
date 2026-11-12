import { test } from "../fixtures.js";
import { expect, openView, getButtonByAction } from '../tools.js';


test.describe("Builder Components/Standalone Routines", () => {
    // Builder view showing a new experiment, closed after these tests
    let page
    // Component profiles fetched from Python
    let profiles
    // example params of each input Type ([element class, category, param])
    let inputTypes = {}

    test.beforeAll(async ({ app, builder }) => {
        // start listening for a new window
        let prom = app.waitForEvent("window")
        // click the ribbon button to create a new window
        let newBtn = getButtonByAction(builder.locator("#ribbon"), "new");
        await newBtn.click();
        // assign it to `page` when one appears
        page = await prom
        // get element profiles from Python
        profiles = await page.evaluate(async () => await python.liaison.send("app", {
            command: "run",
            args: ["psychopy.experiment:getElementProfiles"]
        }))
        // iterate through elements
        for (let [cls, element] of Object.entries(profiles)) {
            // skip elements not represented in the Components panel
            if (["SettingsComponent", "RoutineSettingsComponent"].includes(cls)) {
                continue
            }
            // iterate through params
            for (let [paramName, param] of Object.entries(element.params)) {
                // skip start/stop params as they don't follow the param-ctrl > param-value structure
                if (["startVal", "startType", "startEstim", "stopVal", "stopType", "durationEstim"].includes(paramName)) {
                    continue
                }
                // if we don't have an example param for this inputType yet, add it
                if (!(param.inputType in inputTypes)) {
                    inputTypes[param.inputType] = [cls, param.categ, paramName]
                }
            }
        }
    })

    test.afterAll(async () => {
        // close page when we're done
        await page?.close()
    })

    async function getContextBtn(node, testid) {
        // right click it
        await node.click({ button: "right"})
        // get the menu
        let menu = page.locator("div.menu").first()
        await expect(menu).toBeVisible()
        // handle submenus
        while (testid.includes(":")) {
            let parentid
            // separate the first part of testid
            ;[parentid, testid] = testid.split(/:(.*)/s)
            // open the submenu
            let parentBtn = menu.getByTestId(parentid)
            await parentBtn.click()
            // use the submenu as our new menu
            menu = menu.locator("div.menu").first()
        }
        // get the button
        return menu.getByTestId(testid)
    }

    async function getRoutineTab(routine) {
        // get all tabs
        let tabs = page.locator("#routines-notebook .notebook-tabs").first()
        // test id should match routine name
        let tab = tabs.getByTestId(routine)
        // check that it exists
        await expect(tab, `Could not find tab for Routine ${routine}`).toBeAttached()

        return tab
    }

    async function getComponentNode(component, routine=undefined) {
        if (routine) {
            // select the correct Routine
            let tab = await getRoutineTab(routine)
            await tab.click()
        }
        // get the Routine canvas
        let canvas = page.locator(".routine-canvas").first()
        // make sure the Routine canvas exists...
        await expect(canvas).toBeAttached()
        // get the Component node from the Routine canvas
        let node = await canvas.locator(`#${component}`).first()
        // check that it exists
        await expect(node, `No node in ${routine}'s Routine Canvas for ${component}`).toBeAttached()

        return node
    }

    async function getParamCtrl(element, categ, param, routine=undefined) {
        let ctrl, dlg
        // if we're in a Routine, then we're looking for a Component
        if (routine) {
            // get Component node
            let node = await getComponentNode(element, routine)
            // click it to open Component dialog
            await node.click()
            // get the resulting dialog
            dlg = await page.getByTestId(`${element}-parameters`)
            // check it exists
            expect(dlg, `No dialog appeared when clicking on ${element} (Routine ${routine})`).toBeAttached()
            // navigate to categ tab
            if (categ) {
                // get tab
                let tab = dlg.locator(`.notebook-tabs button[data-testid=${categ}]`).first()
                await expect(tab, `Component ${element} has no tab for category ${categ}`).toBeAttached()
                // click it
                await tab.click()
            }
            // get param ctrl
            ctrl = await dlg.locator(`.param-ctrl #${param}`).first()
            // check that it exists
            await expect(ctrl, `No control from param ${param} (category ${categ}) in Component ${element} (Routine ${routine})`).toBeAttached()
        } else {
            // select Routine tab
            let tab = await getRoutineTab(element)
            await tab.click()
            // get param ctrl
            ctrl = page.locator(`.params-panel .param-ctrl#${param} .param-value`)
            // check that it exists
            await expect(ctrl, `No control from param ${param} (category ${categ}) in Routine ${element}`).toBeAttached()
        }

        return [ctrl, dlg]
    }

    async function newElement(cls, routine=undefined) {
        // wait for Components to load in from Python
        let collapsed = page.locator("#components .components:not([data-fallback=true]) button[data-testclass=component-category]:not(.active)")
        await expect(collapsed.first()).toBeVisible({ timeout: 60_000 })
        // expand all categories so buttons are visible
        while (await collapsed.count()) {
            await collapsed.first().click()
        }
        if (routine) {
            // make sure routine is selected
            let tab = await getRoutineTab(routine)
            await tab.click()
        }
        // get buttons from the Components panel
        let newElementBtns = page.locator(
            "#components .components button:not([data-testclass=component-category])"
        )
        // get button for this class
        let btn = newElementBtns.and(
            page.locator(`[data-tag=${cls}]`)
        ).first()
        // check it exists
        await expect(btn, `No button in Components panel for ${cls}`).toBeAttached()
        // click the button
        await btn.click()
        // this will be the Component/Routine's name
        let name
        // process diverges here for Components vs Routines...
        if (await btn.getAttribute("data-testclass") === "component") {
            // get the resulting dialog and its OK button
            let dlg = page.getByTestId("new-component")
            let okBtn = getButtonByAction(dlg, "OK")
            // the OK button should always start off enabled
            await expect(okBtn, `${cls} Component shouldn't start off invalid`).not.toBeDisabled()
            // get the name
            name = await dlg.locator("input#name").inputValue()
            // press OK to add the Component
            await okBtn.click()
        } else {
            // get new Routine's name
            name = await page.locator("#routines-notebook input#name").first().inputValue()
        }
        
        return [name, routine]
    }

    async function deleteElement(element, routine=undefined) {
        if (routine) {
            // get the corresponding node in the Routine canvas (checks that it exists)
            let node = await getComponentNode(element, "trial")
            // delete it
            let deleteBtn = await getContextBtn(node, "delete-component")
            await deleteBtn.click()
        } else {
            // get Routine tab (checks that it exists)
            let tab = await getRoutineTab(element)
            // delete it
            let deleteBtn = tab.locator(".close-btn").first()
            await deleteBtn.click()
        }
        
    }
    
    test("Add every Component / Standalone Routine", async () => {
        // get all buttons in the Components panel
        let buttons = page.locator("#components .components button:not([data-testclass=component-category])")
        // confirm that there are some
        await expect(buttons.first(), "No Component buttons found").toBeVisible()
        // iterate over Component buttons...
        for (let btn of await buttons.and(page.locator("button[data-testclass=component]")).all()) {
            // get class of Component
            let cls = await btn.getAttribute("data-tag")
            // add a test step for adding this Component
            await test.step(`Add ${cls}`, async () => {
                // create new Component
                let [name, routine] = await newElement(cls, "trial")
                // get the corresponding node in the Routine canvas (checks that it exists)
                let node = await getComponentNode(name, "trial")
                // delete Component
                await deleteElement(name, routine)
            })
        }
        // iterate over Standalone Routine buttons...
        for (let btn of await buttons.and(page.locator("[data-testclass=routine]")).all()) {
            // get class of Routine
            let cls = await btn.getAttribute("data-tag")
            // add a test step for adding this Routine
            await test.step(`Add ${cls}`, async () => {
                // create new Routine
                let [name, _] = await newElement(cls)
                // get Routine tab (checks that it exists)
                await getRoutineTab(name)
                // delete Routine
                await deleteElement(name)
            })
        }
    })

    /** Tests for each inputType */

    test("inputType name", async () => {
        // get example param
        let [cls, categ, param] = inputTypes['name']
        // create element
        let [element, routine] = await newElement(cls, "trial")
        // get param ctrl
        let [ctrl, dlg] = await getParamCtrl(element, categ, param, routine)
        // check that its value is the element name
        await expect(ctrl, "Name param should match element's name").toHaveValue(element)
        // close dialog
        if (dlg) {
            let closeBtn = getButtonByAction(dlg, "CANCEL")
            await closeBtn.click()
        }
        // delete element
        await deleteElement(element, routine)
    })
})
