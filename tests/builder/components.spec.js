import { test } from "../fixtures.js";
import { expect, openView, getButtonByAction } from '../tools.js';


test.describe("Builder Components/Standalone Routines", () => {
    // Builder view showing a new experiment, closed after these tests
    let page
    // Component profiles fetched from Python
    let profiles

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
        // wait for Components to load in from Python
        let collapsed = page.locator("#components .components:not([data-fallback=true]) button[data-testclass=component-category]:not(.active)")
        await expect(collapsed.first()).toBeVisible({ timeout: 60_000 })
        // expand all categories so buttons are visible
        while (await collapsed.count()) {
            await collapsed.first().click()
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
        // for Experiment Settings, return the ribbon button
        if (component === "Experiment") {
            let ribbon = await page.locator("#ribbon");
            return ribbon.getByTestId("experiment-settings-btn")
        }
        // select the correct Routine
        if (routine) {
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
            dlg = page.locator(`dialog[data-testid="${element}-parameters"][open]`)
            // check it exists
            await expect(dlg, `No dialog appeared when clicking on ${element} (Routine ${routine})`).toBeAttached()
            // navigate to categ tab
            if (categ) {
                // get tab
                let tab = await dlg.locator(`.notebook-tabs button[data-testid="${categ}"]`).first()
                await expect(tab, `Component ${element} has no tab for category ${categ}`).toBeAttached()
                // click it
                await tab.click()
            }
            // get param ctrl
            ctrl = await dlg.locator(`.param-ctrl [id="${param}"]`).first()
            // check that it exists
            await expect(ctrl, `No control from param ${param} (category ${categ}) in Component ${element} (Routine ${routine})`).toBeAttached()
        } else {
            // select Routine tab
            let tab = await getRoutineTab(element)
            await tab.click()
            // get param ctrl
            ctrl = page.locator(`.params-panel .param-ctrl [id="${param}"]`).first()
            // check that it exists
            await expect(ctrl, `No control from param ${param} (category ${categ}) in Routine ${element}`).toBeAttached()
        }

        return [ctrl, dlg]
    }

    async function newElement(cls, routine=undefined) {
        // for experiment settings, it already exists
        if (cls === "SettingsComponent") {
            return ["Experiment", "settings"]
        }
        // make sure routine is selected
        if (routine) {
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
        // don't delete experiment settings
        if (element === "Experiment") {
            return
        }
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

    async function setupInputTypeTest(cls, categ, param) {
        let routine = cls.endsWith("omponent") ? "trial" : undefined
        // create element
        let element
        [element, routine] = await newElement(cls, routine)
        // get param ctrl
        let [ctrl, dlg] = await getParamCtrl(element, categ, param, routine)

        return {
            cls: cls,
            categ: categ,
            param: param,
            element: element,
            routine: routine,
            ctrl: ctrl,
            dlg: dlg
        }
    }

    async function teardownInputTypeTest(context) {
        // close dialog
        if (context.dlg) {
            let closeBtn = getButtonByAction(context.dlg, "CANCEL")
            await closeBtn.click()
        }
        // delete element
        await deleteElement(context.element, context.routine)
    }

    /**
     * Fill a text-based ctrl and check that it holds the value
     */
    async function checkTextCtrl(context, value) {
        await context.ctrl.fill(value)
        await expect(context.ctrl, `${context.inputType} ctrl should hold typed value`).toHaveValue(value)
    }

    /**
     * Pick a different option in a select-based ctrl and check that it's selected
     */
    async function checkSelectCtrl(context) {
        // wait for options to load
        let options = context.ctrl.locator("option")
        await expect(options.first()).not.toHaveText(/Loading/)
        // find an option other than the current one
        let current = await context.ctrl.inputValue()
        let values = await options.evaluateAll(opts => opts.map(opt => opt.value))
        let target = values.find(val => val !== current)
        expect(target, `${context.inputType} ctrl should have more than one option`).toBeDefined()
        // select it
        await context.ctrl.selectOption(target)
        await expect(context.ctrl, `${context.inputType} ctrl should hold selected option`).toHaveValue(target)
    }

    test("inputType name", async () => {
        // setup for test
        let context = await setupInputTypeTest("ApertureComponent", null, "name")
        // check that its value is the element name
        await expect(context.ctrl, "Name param should match element's name").toHaveValue(context.element)
        // teardown after test
        await teardownInputTypeTest(context)
    })

    test("inputType single", async () => {
        // setup for test
        let context = await setupInputTypeTest("ApertureComponent", "Layout", "size")
        // check that typed values are held
        await checkTextCtrl(context, "test value")
        // check that a $ marks the value as code
        await checkTextCtrl(context, "$testValue")
        await expect(context.ctrl, "Value starting with $ should be marked as code").toHaveClass(/\bcode\b/)
        // teardown after test
        await teardownInputTypeTest(context)
    })

    test("inputType choice", async () => {
        // setup for test
        let context = await setupInputTypeTest("ApertureComponent", "Layout", "units")
        // check that a different option can be selected
        await checkSelectCtrl(context)
        // teardown after test
        await teardownInputTypeTest(context)
    })

    test("inputType spin", async () => {
        // setup for test
        let context = await setupInputTypeTest("ApertureComponent", "Layout", "ori")
        // spin falls back to a single line ctrl, so check that typed values are held
        await checkTextCtrl(context, "45")
        // teardown after test
        await teardownInputTypeTest(context)
    })

    test("inputType bool", async () => {
        // setup for test
        let context = await setupInputTypeTest("ApertureComponent", "Data", "saveStartStop")
        // toggle the checkbox
        let was = await context.ctrl.isChecked()
        await context.ctrl.setChecked(!was)
        await expect(context.ctrl, "Bool ctrl should toggle when clicked").toBeChecked({ checked: !was })
        // toggle it back
        await context.ctrl.setChecked(was)
        await expect(context.ctrl, "Bool ctrl should toggle back when clicked again").toBeChecked({ checked: was })
        // teardown after test
        await teardownInputTypeTest(context)
    })

    test("inputType validator", async () => {
        // add a validator
        let [validator, _] = await newElement("VisualValidatorRoutine")
        // setup for test
        let context = await setupInputTypeTest("ApertureComponent", "Testing", "validator")
        // wait for options to load
        let options = context.ctrl.locator("option")
        await expect(options.first()).not.toHaveText(/Loading/)
        // does the control include the validator?
        await expect(context.ctrl.locator(`option[value="${validator}"]`)).toBeAttached()
        // close element dialog
        let closeBtn = getButtonByAction(context.dlg, "CANCEL")
        await closeBtn.click()
        // delete validator
        await deleteElement(validator)
        // get ctrl again
        ;[context.ctrl, context.dlg] = await getParamCtrl(context.element, context.categ, context.param, context.routine)
        // does the control still include the validator? (it shouldn't)
        await expect(context.ctrl.locator(`option[value="${validator}"]`)).not.toBeAttached()
        // teardown after test
        await teardownInputTypeTest(context)
    })

    test("inputType color", async () => {
        // setup for test
        let context = await setupInputTypeTest("PolygonComponent", "Appearance", "fillColor")
        // check that typed values are held
        await checkTextCtrl(context, "red")
        // TODO: check that the color picker dialog sets the value
        // teardown after test
        await teardownInputTypeTest(context)
    })

    test("inputType code", async () => {
        // setup for test
        let context = await setupInputTypeTest("ButtonComponent", "Basic", "callback")
        // click into the Monaco editor and type at the end
        await context.ctrl.locator(".monaco-editor").first().click()
        await page.keyboard.press("ControlOrMeta+End")
        await page.keyboard.type("testCodeValue")
        // check that it's shown in the editor
        await expect(
            context.ctrl.locator(".view-lines"), "Code ctrl should show typed code"
        ).toContainText("testCodeValue")
        // teardown after test
        await teardownInputTypeTest(context)
    })

    test("inputType font", async () => {
        // setup for test
        let context = await setupInputTypeTest("TextboxComponent", "Formatting", "font")
        // check that typed values are held
        await checkTextCtrl(context, "Arial")
        // TODO: check that the font manager dialog sets the value
        // teardown after test
        await teardownInputTypeTest(context)
    })

    test("inputType device", async () => {
        // setup for test
        let context = await setupInputTypeTest("ButtonBoxComponent", "Device", "deviceLabel")
        // TODO: add a device in the Device Manager and check that it's offered as an option
        // teardown after test
        await teardownInputTypeTest(context)
    })

    test("inputType table", async () => {
        // setup for test
        let context = await setupInputTypeTest("FormComponent", "Basic", "Items")
        // check that typed values are held
        await checkTextCtrl(context, "conditions.xlsx")
        // TODO: check the open/create table button
        // teardown after test
        await teardownInputTypeTest(context)
    })

    test("inputType file", async () => {
        // setup for test
        let context = await setupInputTypeTest("GratingComponent", "Texture", "tex")
        // check that typed values are held
        await checkTextCtrl(context, "image.png")
        // TODO: check the browse button (opens a native file dialog)
        // teardown after test
        await teardownInputTypeTest(context)
    })

    test("inputType int", async () => {
        // setup for test
        let context = await setupInputTypeTest("JoyButtonsComponent", "Device", "deviceNumber")
        // int falls back to a single line ctrl, so check that typed values are held
        await checkTextCtrl(context, "2")
        // teardown after test
        await teardownInputTypeTest(context)
    })

    test("inputType fileList", async () => {
        // can't setup at present, because it needs to have at least one value for there to be a ctrl with the ID
        /**
        // setup for test
        let context = await setupInputTypeTest("ResourceManagerComponent", "Basic", "resources")
        // TODO: check that "Add item" adds a file ctrl and that the delete button removes it
        // teardown after test
        await teardownInputTypeTest(context)
         */
    })

    test("inputType multi", async () => {
        // setup for test
        let context = await setupInputTypeTest("TextboxComponent", "Basic", "text")
        // check that typed values (including newlines) are held
        await checkTextCtrl(context, "line one\nline two")
        // teardown after test
        await teardownInputTypeTest(context)
    })

    test("inputType version", async () => {
        // setup for test
        let context = await setupInputTypeTest("SettingsComponent", "Basic", "Use version")
        // TODO: check version options (fetched from GitHub, so needs network access)
        // teardown after test
        await teardownInputTypeTest(context)
    })

    test("inputType dict", async () => {
        // not yet tested because there's no ID's input
        /**
        // setup for test
        let context = await setupInputTypeTest("SettingsComponent", "Basic", "Experiment info")
        // TODO: check adding, renaming and removing keys
        // teardown after test
        await teardownInputTypeTest(context)
         */
    })

    test("inputType screen", async () => {
        // setup for test
        let context = await setupInputTypeTest("SettingsComponent", "Screen", "Screen")
        // check that typed values are held
        await checkTextCtrl(context, "2")
        // teardown after test
        await teardownInputTypeTest(context)
    })

    test("inputType multiChoice", async () => {
        // setup for test
        let context = await setupInputTypeTest("SliderComponent", "Appearance", "styleTweaks")
        // get the first option's checkbox (once options have loaded)
        let checkbox = context.ctrl.locator("input[type=checkbox]").first()
        await expect(checkbox, "MultiChoice ctrl should have options").toBeAttached()
        // toggle it
        let was = await checkbox.isChecked()
        await checkbox.setChecked(!was)
        await expect(checkbox, "MultiChoice option should toggle when clicked").toBeChecked({ checked: !was })
        // teardown after test
        await teardownInputTypeTest(context)
    })

    test("inputType soundFile", async () => {
        // setup for test
        let context = await setupInputTypeTest("SoundComponent", "Basic", "sound")
        // check that typed values are held (sound accepts note names as well as files)
        await checkTextCtrl(context, "A")
        // teardown after test
        await teardownInputTypeTest(context)
    })

    test("inputType richChoice", async () => {
        // setup for test
        let context = await setupInputTypeTest("PavloviaSurveyRoutine", "Basic", "surveyType")
        // wait for options to load
        let options = context.ctrl.locator("button.rich-ctrl-item")
        await expect(options.first(), "RichChoice ctrl should have options").toBeAttached()
        // find an option which isn't currently selected
        let target = context.ctrl.locator("button.rich-ctrl-item:not(.selected)").first()
        await expect(target, "RichChoice ctrl should have more than one option").toBeAttached()
        let label = await target.getAttribute("aria-label")
        // click its first non-link child, so we don't land on the "more info" link
        await target.locator("*:not(a, a *)").first().click()
        // check that it's now selected
        let clicked = context.ctrl.getByRole("button", { name: label, exact: true })
        await expect(clicked, "RichChoice option should be selected when clicked").toHaveClass(/\bselected\b/)
        // check that it's the only selected option
        await expect(context.ctrl.locator("button.rich-ctrl-item.selected"), "Only one RichChoice option should be selected").toHaveCount(1)
        // teardown after test
        await teardownInputTypeTest(context)
    })

    test("inputType survey", async () => {
        // setup for test
        let context = await setupInputTypeTest("PavloviaSurveyRoutine", "Basic", "surveyId")
        // check that typed values are held
        await checkTextCtrl(context, "test-survey-id")
        // TODO: check the browse surveys dialog (needs a Pavlovia login)
        // teardown after test
        await teardownInputTypeTest(context)
    })
})
