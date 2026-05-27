<script>
    import {
        // file
        file_new,
        file_open,
        file_save,
        file_save_as,
        // edit
        undo,
        redo,
        // experiment
        sendToRunner,
        compilePython,
        compileJS,
        runPython,
        showWindow,
        runJS,
        stopPython,
    } from '../callbacks.svelte.js'
    
    import Menu from "./Menu.svelte";
    import { Ribbon, RibbonSection, RibbonGap } from '$lib/utils/ribbon';
    import { getContext } from "svelte";
    import { electron, python, git } from "$lib/globals.svelte.js";
    import SavePrompt from "./SavePrompt.svelte";
    import { FindDialog } from "$lib/dialogs/find/index.js";
    import { DeviceManagerDialog } from "$lib/dialogs/deviceManager/index.js"
    import ParamsDialog from "$lib/paramCtrls/ParamsDialog.svelte";
    import { IconButton, SwitchButton } from '$lib/utils/buttons';
    import { UserCtrl, ProjectCtrl } from '$lib/pavlovia';
    import MonitorCenterDlg from '$lib/dialogs/monitorCenter/MonitorCenterDlg.svelte';
    import PavloviaSync from "$lib/pavlovia/Sync.svelte";
    import { translate } from "$lib/translation";

    let current = getContext("current");

    let show = $state({
        settingsDlg: false,
        findDlg: false,
        deviceMgrDlg: false,
        monitorCenterDlg: false
    })

    let awaiting = $state({
        runpy: Promise.resolve(""),
        compilepy: Promise.resolve(""),
        runjs: Promise.resolve(""),
        compilejs: Promise.resolve("")
    })

    let lastAction = $derived.by(() => {
        if (current.experiment.history.past.length) {
            return ` "${current.experiment.history.past.at(-1).msg}"`
        }
    })
    let nextAction = $derived.by(() => {
        if (current.experiment.history.future.length) {
            return ` "${current.experiment.history.future[0].msg}"`
        }
    })

    let prompts = $state({
        NEW: false,
        OPEN: false,
        PYCOMPILE: false,
        PYRUN: false
    });
</script>

<Ribbon>
    <Menu />
    
    <RibbonSection label={translate("File")} icon="/icons/rbn-file.svg">
        <IconButton 
            icon="/icons/btn-new.svg" 
            label={translate("New file")} 
            onclick={(evt) => prompts.NEW = true}
            borderless
        />
        <SavePrompt
            bind:shown={prompts.NEW}
            action={file_new}
        />  
        <IconButton 
            icon="/icons/btn-open.svg" 
            label={translate("Open file")} 
            onclick={(evt) => prompts.OPEN = true} 
            borderless
        />
        <SavePrompt
            bind:shown={prompts.OPEN}
            action={file_open}
        />
        <IconButton 
            icon="/icons/btn-save.svg" 
            label={translate("Save file")} 
            onclick={file_save}
            disabled={!current.experiment.history.past.length && current.experiment.file.file} 
            borderless
        />
        <IconButton 
            icon="/icons/btn-saveas.svg" 
            label={translate("Save file as")}
            onclick={file_save_as} 
            borderless
        />
    </RibbonSection>

    <RibbonSection label={translate("Edit")} icon="/icons/rbn-edit.svg">
        <IconButton 
            icon="/icons/btn-undo.svg" 
            label={translate("Undo")} 
            onclick={undo} 
            disabled={!current.experiment.file.file || !current.experiment.history.past.length} 
            borderless
        />
        <IconButton 
            icon="/icons/btn-redo.svg" 
            label={translate("Redo")} 
            onclick={redo} 
            disabled={!current.experiment.file.file || !current.experiment.history.future.length} 
            borderless
        />
        <IconButton 
            icon="/icons/btn-find.svg" 
            label={translate("Find")} 
            onclick={() => show.findDlg = true}
            borderless
        />
        <FindDialog
            bind:shown={show.findDlg}
        ></FindDialog>
    </RibbonSection>
    
    <RibbonSection label={translate("Experiment")} icon="/icons/rbn-experiment.svg">
        {#if python?.ready}
            <IconButton
                icon="/icons/btn-monitors.svg"
                label={translate("Open the monitor center")}
                onclick={(evt) => show.monitorCenterDlg = true}
                borderless
            ></IconButton>
            <MonitorCenterDlg
                bind:shown={show.monitorCenterDlg}
            />
            <IconButton
                icon="/icons/btn-devices.svg"
                label={translate("Open the device manager")}
                onclick={(evt) => show.deviceMgrDlg = true}
                borderless
            ></IconButton>
            <DeviceManagerDialog
                bind:shown={show.deviceMgrDlg}
            />
        {/if}

        <IconButton 
            icon="/icons/btn-settings.svg" 
            label={translate("Experiment settings")} 
            onclick={(evt) => show.settingsDlg = true}
            disabled={current.experiment === null}
            borderless
        />
        {#if current.experiment !== null }
            <ParamsDialog
                element={current.experiment.settings}
                bind:shown={show.settingsDlg}
            />
        {/if}
        <SwitchButton 
            labels={[translate("Pilot"), translate("Run")]} 
            tooltip={current.experiment?.pilotMode ? "Experiment will run in pilot mode" : "Experiment will run in run mode"}
            bind:value={
                () => !current.experiment.pilotMode,
                (value) => {
                    // update history
                    current.experiment.history.update(`toggle pilot mode`)
                    // set pilot mode
                    current.experiment.setPilotMode(!value);
                }
            } 
            disabled={current.experiment === null}
        />  
        
        {#if python?.ready}
            <IconButton 
                icon="/icons/btn-send{current.experiment.pilotMode ? "pilot" : "run"}.svg" 
                label={translate("Send experiment to runner")} 
                onclick={sendToRunner}
                disabled={!current.experiment.file.file}
                borderless
            /> 
        {/if}
    </RibbonSection>

    {#if python?.ready}
        <RibbonSection label={translate("Desktop")} icon="/icons/rbn-desktop.svg">
            <IconButton 
                icon="/icons/btn-compilepy.svg" 
                label={translate("Write experiment as a .py file")} 
                onclick={evt => compilePython()}
                disabled={!current.experiment.file.file}
                bind:awaiting={awaiting.compilepy}
                borderless
            /> 
            <IconButton 
                icon="/icons/btn-{current.experiment.pilotMode ? "pilot" : "run"}py.svg" 
                label={current.experiment.pilotMode ? translate("Pilot experiment locally") : translate("Run experiment locally")}
                onclick={evt => runPython()}
                disabled={!current.experiment.file.file}
                bind:awaiting={awaiting.runpy}
                cancel={evt => stopPython()}
                borderless
            />
        </RibbonSection>

        <RibbonSection label={translate("Browser")} icon="/icons/rbn-browser.svg">
            <IconButton 
                    icon="/icons/btn-compilejs.svg" 
                    label={translate("Write experiment as a .js file")} 
                    onclick={(evt) => compileJS()}
                    disabled={!current.experiment.file.file}
                    bind:awaiting={awaiting.compilejs}
                    borderless
                />
                <IconButton 
                    icon="/icons/btn-{current.experiment.pilotMode ? "pilot" : "run"}js.svg" 
                    label={current.experiment.pilotMode ? translate("Pilot experiment in browser") : translate("Run experiment in browser")}
                    onclick={(evt) => runJS()}
                    disabled={!current.experiment.file.file || (!current.experiment.pilotMode && !current.project)}
                    bind:awaiting={awaiting.runjs}
                    borderless
                />
        </RibbonSection>
    {/if}

    <!-- <RibbonSection id=browser label=Browser icon="/icons/rbn-browser.svg">
        <IconButton 
            id="ribbon-btn-sync" 
            icon="/icons/btn-sync.svg" 
            label={translate("Sync to Pavlovia")} 
        />
    -->

    <RibbonSection label={translate("Pavlovia")} icon="/icons/rbn-pavlovia.svg">
        
        <PavloviaSync>
            {#snippet button(sync)}
                <IconButton 
                    icon="/icons/btn-sync.svg" 
                    label={translate("Sync experiment")} 
                    onclick={(evt) => sync(
                        $state.snapshot(current.experiment.file.parent), 
                        $state.snapshot(current.user),
                        true
                    )}
                    disabled={!current.user || !current.experiment.file.file}
                    borderless
                />
            {/snippet}
        </PavloviaSync>
        <div class=padded>
            <UserCtrl />
        </div>
        <div class=padded>
            <ProjectCtrl />
        </div>
    </RibbonSection>

    <RibbonGap></RibbonGap>

    <RibbonSection label=Views icon="/icons/rbn-windows.svg">
        <IconButton 
            icon="/icons/btn-builder.svg" 
            label={translate("Builder view")} 
            onclick={(evt) => showWindow("builder")} 
            borderless
            disabled
        />
        <IconButton 
            icon="/icons/btn-coder.svg" 
            label={translate("Coder view")} 
            onclick={(evt) => showWindow("coder")} 
            borderless
        />
        {#if electron}
            <IconButton 
                icon="/icons/btn-runner.svg" 
                label={translate("Runner view")} 
                onclick={(evt) => showWindow("runner")} 
                borderless
            />
        {/if}
    </RibbonSection>
</Ribbon>

<style>
    .padded {
        display: flex;
        padding: 0 .25rem;
    }
</style>