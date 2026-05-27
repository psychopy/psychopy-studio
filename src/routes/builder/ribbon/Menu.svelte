<script>
    import { getContext } from "svelte";
    import { Menu, MenuItem, MenuSeparator, SubMenu } from '$lib/utils/menu/frameMenu';
    import PrefsDialog from '$lib/dialogs/preferences/PrefsDialog.svelte';
    import ParamsDialog from "$lib/paramCtrls/ParamsDialog.svelte";
    import { FindDialog } from "$lib/dialogs/find";
    import { BugReportDlg } from "$lib/dialogs/bugReport";
    import { prefs } from "$lib/preferences.svelte"; 
    import { electron, python } from "$lib/globals.svelte";
    import { DeviceManagerDialog } from "$lib/dialogs/deviceManager/index.js";
    import { PluginManagerDlg, PsychoPyBranchDlg } from "$lib/dialogs/pluginManager";
    import { setupPython } from "$lib/python";
    import { Version } from "$lib/utils/versions";
    import { translate } from "$lib/translation";

    import {
        // file
        file_new,
        file_open,
        file_save,
        file_save_as,
        revealFolder,
        close,
        quit,
        // edit
        undo,
        redo,
        // view
        newWindow,
        showWindow,
        showDevTools,
        // experiment
        showReadme,
        copyRoutine,
        pasteRoutine,
        // run
        togglePiloting,
        sendToRunner,
        compilePython,
        compileJS,
        runPython,
        runJS
    } from '../callbacks.svelte.js';

    let current = getContext("current");

    let {
        shown=$bindable()
    } = $props()

    let show = $state({
        prefsDlg: false,
        findDlg: false,
        settingsDlg: false,
        deviceMgrDlg: false,
        pluginMgr: false,
        psychopyBranchDlg: false,
        bugReport: false
    })
</script>


<Menu 
    bind:shown={shown}
>
    <SubMenu 
        label={translate("File")} 
        icon="/icons/rbn-file.svg"
    >
        <MenuItem 
            icon="/icons/btn-new.svg" 
            label={translate("New file")}
            shortcut="new"
            onclick={file_new}
        />
        <MenuItem 
            icon="/icons/btn-open.svg" 
            label={translate("Open file")} 
            shortcut="open"
            onclick={file_open} 
        />
        <MenuItem 
            icon="/icons/btn-save.svg" 
            label={translate("Save file")}
            shortcut="save"
            onclick={file_save} 
            disabled={!current.experiment.history.past.length} 
        />
        <MenuItem 
            icon="/icons/btn-saveas.svg" 
            label={translate("Save file as")}
            shortcut="saveAs"
            onclick={file_save_as} 
        />
        <MenuItem
            label={translate("Reveal in file explorer")}
            onclick={revealFolder}
            shortcut="revealFolder"
            disabled={current.experiment.file?.parent === undefined}
        />
        <MenuItem
            label={translate("Close window")}
            onclick={close}
            shortcut="close"
        />

        <MenuSeparator />

        <MenuItem
            icon="/icons/btn-settings.svg"
            label={translate("Preferences")}
            onclick={(evt) => {show.prefsDlg = true}}
        />
        <MenuItem
            label={translate("Reset preferences")}
            onclick={evt => prefs.reset()}
        />
        
        {#if electron}
            <MenuSeparator />

            {#await electron.version() then version}
                {#if version === "dev" || Version.parse(version).extra}
                    
                    <MenuItem
                        label={translate("Report bug")}
                        onclick={evt => show.bugReport = true}
                    />
                {/if}
                
                <MenuItem
                    label={translate("Quit")}
                    onclick={quit}
                    shortcut="quit"
                />
            {/await}
        {/if}
    </SubMenu>

    <SubMenu label={translate("Edit")} icon="/icons/rbn-edit.svg">
        <MenuItem 
            label={translate("Undo")}
            icon="/icons/btn-undo.svg"
            disabled={current.experiment.file === null || !current.experiment.history.past.length}
            onclick={undo}
            shortcut="undo"
        />
        <MenuItem 
            label={translate("Redo")}
            icon="/icons/btn-redo.svg"
            onclick={redo}
            disabled={current.experiment.file === null || !current.experiment.history.future.length}
            shortcut="redo"
        />
        <MenuSeparator />
        <MenuItem 
            label={translate("Find in experiment")}
            icon="/icons/btn-find.svg"
            onclick={evt => show.findDlg = true}
            shortcut="find"
        />
    </SubMenu>

    <SubMenu label={translate("View")} icon="/icons/rbn-windows.svg">
        <MenuItem 
            label={translate("Show Coder")}
            onclick={evt => showWindow("coder")}
        />
        <MenuItem 
            label={translate("Show Runner")}
            onclick={evt => showWindow("runner")}
        />

        <MenuSeparator />

        <MenuItem 
            label={translate("Show developer tools")}
            onclick={showDevTools}
            shortcut="showDevTools"
        />
    </SubMenu>

    <SubMenu label={translate("Experiment")} icon="/icons/rbn-experiment.svg">
        <MenuItem 
            label={translate("Experiment settings")}
            icon="/icons/btn-settings.svg"
            onclick={evt => show.settingsDlg = true}
        />

        <MenuItem 
            label={translate("Show readme")}
            icon="/icons/btn-new.svg"
            onclick={evt => showReadme()}
        />

        <MenuSeparator />

        <MenuItem 
            label={translate("Copy current Routine")}
            icon="/icons/btn-copy.svg"
            onclick={evt => copyRoutine()}
        />

        <MenuItem 
            label={translate("Paste Routine")}
            icon="/icons/btn-paste.svg"
            onclick={evt => pasteRoutine()}
        />
    </SubMenu>

    {#if electron}
        <SubMenu label={translate("Run")} icon="/icons/btn-runpy.svg">
            <MenuItem 
                label={translate("Toggle pilot mode")}
                onclick={togglePiloting}
                shortcut="togglePilot"
            />
            <MenuItem 
                label={translate("Send to Runner")}
                icon="/icons/btn-send{current.experiment.pilotMode ? "pilot" : "run"}.svg" 
                onclick={sendToRunner}
                shortcut="sendToRunner"
                disabled={!current.experiment.file}
            />

            <MenuSeparator />

            <MenuItem 
                label={translate("Compile Python")}
                icon="/icons/btn-compilepy.svg" 
                onclick={evt => compilePython()}
                shortcut="compilePython"
                disabled={current.experiment === null}
            /> 
            <MenuItem 
                label={current.experiment.pilotMode ? translate("Pilot in Python") : translate("Run in Python")}
                icon="/icons/btn-{current.experiment.pilotMode ? "pilot" : "run"}py.svg" 
                onclick={evt => runPython()}
                shortcut="runPython"
                disabled={current.experiment === null}
            />

            <MenuSeparator />

            <MenuItem 
                label={translate("Compile JS")} 
                icon="/icons/btn-compilejs.svg" 
                onclick={(evt) => compileJS()}
                shortcut="compileJS"
                disabled={current.experiment === null}
            />
            <MenuItem 
                label={current.experiment.pilotMode ? "Pilot in browser" : "Run in browser"}
                icon="/icons/btn-{current.experiment.pilotMode ? "pilot" : "run"}js.svg" 
                onclick={(evt) => runJS()}
                shortcut="runJS"
                disabled={current.experiment === null}
            />
        </SubMenu>
    {/if}

    <SubMenu label={translate("Tools")} icon="/icons/btn-hamburger.svg">
        <MenuItem 
            label={translate("Open device manager")}
            icon="/icons/btn-devices.svg"
            onclick={evt => show.deviceMgrDlg = true}
        />
        {#if python?.ready}
            <MenuItem 
                label={translate("Manage plugins and packages")}
                icon="/icons/btn-plugin.svg"
                onclick={evt => show.pluginMgr = true}
                disabled={!python?.ready}
            />
        {/if}

        {#if electron}
            <MenuSeparator />

            <MenuItem 
                label={translate("Open PsychoPy user folder")}
                onclick={evt => electron.paths.user().then(
                    folder => electron.files.openPath(folder)
                )}
            />
        {/if}
        {#if python}
            <MenuItem 
                label={translate("Reinstall Python")}
                onclick={evt => setupPython("app", true)}
            />
            <MenuItem
                label="Install PsychoPy from Git"
                onclick={evt => show.psychopyBranchDlg = true}
            />
        {/if}
    </SubMenu>

    <SubMenu label={translate("Help")}>
        <MenuItem 
            label={translate("PsychoPy Homepage")}
            onclick={evt => open("https://www.psychopy.org/")}
        />
        <MenuItem 
            label={translate("Documentation")}
            onclick={evt => open("https://www.psychopy.org/documentation")}
        />
        <MenuItem 
            label={translate("Help Forum")}
            onclick={evt => open("https://discourse.psychopy.org/")}
        />
        <MenuSeparator />
        {#if electron}
            {#await electron.version() then version}
                <MenuItem
                    label="{translate("PsychoPy")} {version}"
                    disabled
                />
            {/await}
        {/if}
    </SubMenu>
</Menu>

<!-- dialogs need to be outside so they're not hidden when the menu is -->
<PrefsDialog
    bind:shown={show.prefsDlg}
/>
<FindDialog
    bind:shown={show.findDlg}
/>
<ParamsDialog
    element={current.experiment.settings}
    bind:shown={show.settingsDlg}
/>
<DeviceManagerDialog
    bind:shown={show.deviceMgrDlg}
/>
{#if python}
    <PluginManagerDlg 
        bind:shown={show.pluginMgr}
    />
    <PsychoPyBranchDlg 
        bind:shown={show.psychopyBranchDlg}
    />
{/if}
{#if electron}
    <BugReportDlg 
        user={current.user}
        context={current.experiment}
        bind:shown={show.bugReport}
    />
{/if}