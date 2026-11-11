<script>
    import callbacks, { prompts, file_new, file_open } from '../callbacks.svelte.js';
    import Menu from "./Menu.svelte";
    import { Ribbon, RibbonSection, RibbonGap } from '$lib/ui/ribbon';
    import { getContext } from "svelte";
    import { electron, python, git } from "$lib/globals.svelte.js";
    import SavePrompt from "./SavePrompt.svelte";
    import { FindDialog } from "$lib/dialogs/find/index.js";
    import { DeviceManagerDialog } from "$lib/dialogs/deviceManager/index.js"
    import ParamsDialog from "$lib/ui/paramCtrls/ParamsDialog.svelte";
    import { Button, SwitchButton } from '$lib/ui/button';
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
</script>

<Ribbon>
    <Menu />
    
    <RibbonSection label={translate("File")} icon="/icons/rbn-file.svg">
        <Button
            icon="/icons/btn-new.svg" 
            tooltip={translate("New file")} 
            action="new"
            ghost
            tight
        />
        <SavePrompt
            bind:shown={prompts.NEW}
            action={file_new}
        />
        <Button
            icon="/icons/btn-open.svg"
            tooltip={translate("Open file")}
            action="open"
            ghost
            tight
        />
        <SavePrompt
            bind:shown={prompts.OPEN}
            action={file_open}
        />
        <Button
            icon="/icons/btn-save.svg" 
            tooltip={translate("Save file")} 
            action="save"
            ghost
            tight
        />
        <Button
            icon="/icons/btn-saveas.svg"
            tooltip={translate("Save file as")}
            action="saveAs"
            ghost
            tight
        />
    </RibbonSection>

    <RibbonSection label={translate("Edit")} icon="/icons/rbn-edit.svg">
        <Button
            icon="/icons/btn-undo.svg" 
            tooltip={translate("Undo")} 
            action="undo"
            ghost
            tight
        />
        <Button
            icon="/icons/btn-redo.svg" 
            tooltip={translate("Redo")} 
            action="redo"
            ghost
            tight
        />
        <Button
            icon="/icons/btn-find.svg" 
            tooltip={translate("Find")} 
            onclick={() => show.findDlg = true}
            ghost
            tight
        />
        <FindDialog
            bind:shown={show.findDlg}
        />
    </RibbonSection>
    
    <RibbonSection label={translate("Experiment")} icon="/icons/rbn-experiment.svg">
        {#if python?.ready}
            <Button
                icon="/icons/btn-monitors.svg"
                tooltip={translate("Open the monitor center")}
                onclick={(evt) => show.monitorCenterDlg = true}
                ghost
                tight
            />
            <MonitorCenterDlg
                bind:shown={show.monitorCenterDlg}
            />
            <Button
                icon="/icons/btn-devices.svg"
                tooltip={translate("Open the device manager")}
                onclick={(evt) => show.deviceMgrDlg = true}
                ghost
                tight
            />
            <DeviceManagerDialog
                bind:shown={show.deviceMgrDlg}
            />
        {/if}

        <Button
            icon="/icons/btn-settings.svg" 
            tooltip={translate("Experiment settings")} 
            onclick={(evt) => show.settingsDlg = true}
            disabled={!current.experiment.settings}
            ghost
            tight
        />
        {#await current.experiment.ready then}
            <ParamsDialog
                element={current.experiment.settings}
                bind:shown={show.settingsDlg}
            />
        {:catch}
            {""}
        {/await}
        <SwitchButton 
            labels={[translate("Pilot"), translate("Run")]} 
            tooltip={current.experiment?.pilotMode ? "Experiment will run in pilot mode" : "Experiment will run in run mode"}
            action="togglePiloting"
            value={!current.experiment.pilotMode}
        />  
        
        {#if python?.ready}
            <Button
                icon="/icons/btn-send{current.experiment.pilotMode ? "pilot" : "run"}.svg" 
                tooltip={translate("Send experiment to runner")} 
                action="sendToRunner"
                ghost
                tight
            /> 
        {/if}
    </RibbonSection>

    {#if python?.ready}
        <RibbonSection label={translate("Desktop")} icon="/icons/rbn-desktop.svg">
            <Button
                icon="/icons/btn-compilepy.svg" 
                tooltip={translate("Write experiment as a .py file")} 
                action="compilePython"
                bind:awaiting={awaiting.compilepy}
                ghost
                tight
            /> 
            <Button
                icon="/icons/btn-{current.experiment.pilotMode ? "pilot" : "run"}py.svg" 
                tooltip={current.experiment.pilotMode ? translate("Pilot experiment locally") : translate("Run experiment locally")}
                action="runPython"
                bind:awaiting={awaiting.runpy}
                cancel={evt => callbacks.stopPython.fcn()}
                ghost
                tight
            />
        </RibbonSection>

        <RibbonSection label={translate("Browser")} icon="/icons/rbn-browser.svg">
            <Button
                    icon="/icons/btn-compilejs.svg" 
                    tooltip={translate("Write experiment as a .js file")} 
                    action="compileJS"
                    bind:awaiting={awaiting.compilejs}
                    ghost
                    tight
                />
                <Button
                    icon="/icons/btn-{current.experiment.pilotMode ? "pilot" : "run"}js.svg" 
                    tooltip={current.experiment.pilotMode ? translate("Pilot experiment in browser") : translate("Run experiment in browser")}
                    action="runJS"
                    bind:awaiting={awaiting.runjs}
                    ghost
                    tight
                />
        </RibbonSection>
    {/if}

    <RibbonSection label={translate("Pavlovia")} icon="/icons/rbn-pavlovia.svg">
        
        <PavloviaSync>
            {#snippet button(sync)}
                <Button
                    icon="/icons/btn-sync.svg" 
                    tooltip={translate("Sync experiment")} 
                    onclick={(evt) => sync(
                        $state.snapshot(current.experiment.file.parent), 
                        $state.snapshot(current.user),
                        true
                    )}
                    disabled={!current.user || !current.experiment.file.file}
                    ghost
                    tight
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
        <Button
            icon="/icons/btn-builder.svg" 
            tooltip={translate("Builder view")} 
            action="showBuilder"
            disabled
            ghost
            tight
        />
        <Button
            icon="/icons/btn-coder.svg" 
            tooltip={translate("Coder view")} 
            action="showCoder"
            ghost
            tight
        />
        {#if electron}
            <Button
                icon="/icons/btn-runner.svg" 
                tooltip={translate("Runner view")} 
                action="showRunner"
                ghost
                tight
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