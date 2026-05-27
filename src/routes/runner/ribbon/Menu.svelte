<script>
    import { getContext } from "svelte";
    import { Menu, MenuItem, MenuSeparator, SubMenu } from '$lib/utils/menu/frameMenu';
    import PrefsDialog from '$lib/dialogs/preferences/PrefsDialog.svelte';
    import { BugReportDlg } from "$lib/dialogs/bugReport";
    import { prefs } from "$lib/preferences.svelte"; 
    import { electron, python } from "$lib/globals.svelte";
    import { showDevTools } from "$lib/utils/views.svelte";
    import { DeviceManagerDialog } from "$lib/dialogs/deviceManager/index.js";
    import { PluginManagerDlg, PsychoPyBranchDlg } from "$lib/dialogs/pluginManager";
    import { setupPython } from "$lib/python";
    import { Version } from "$lib/utils/versions";
    import { translate } from "$lib/translation";

    import {
        // file
        fileNew,
        fileOpen,
        fileSave,
        fileSaveAs,
        quit,
        // run
        togglePiloting,
        // view
        showWindow,
    } from '../callbacks.svelte.js'

    let current = getContext("current");

    let {
        shown=$bindable()
    } = $props()

    let show = $state({
        prefsDlg: false,
        findDlg: false,
        settingsDlg: false,
        bugReport: false,
        psychopyBranchDlg: false,
    })
</script>


<Menu 
    bind:shown={shown}
>
    <SubMenu label={translate("File")} icon="/icons/rbn-file.svg">
        <MenuItem 
            icon="/icons/btn-new.svg" 
            label={translate("New file")}
            shortcut="new"
            onclick={fileNew}
        />
        <MenuItem 
            icon="/icons/btn-open.svg" 
            label={translate("Open file")} 
            shortcut="open"
            onclick={fileOpen} 
        />
        <MenuItem 
            icon="/icons/btn-save.svg" 
            label={translate("Save file")}
            shortcut="save"
            onclick={fileSave}
        />
        <MenuItem 
            icon="/icons/btn-saveas.svg" 
            label={translate("Save file as")}
            shortcut="saveAs"
            onclick={fileSaveAs} 
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
            {#await electron.version() then version}
                {#if version === "dev" || Version.parse(version).extra}
                    <MenuSeparator />
                    
                    <MenuItem
                        label={translate("Report bug")}
                        onclick={evt => show.bugReport = true}
                    />
                {/if}

                <MenuSeparator />

                <MenuItem
                    label={translate("Quit")}
                    onclick={quit}
                    shortcut="quit"
                />
            {/await}
        {/if}
    </SubMenu>

    <SubMenu label={translate("View")} icon="/icons/rbn-windows.svg">
        <MenuItem 
            label={translate("Show Builder")}
            onclick={evt => showWindow("builder")}
        />
        <MenuItem 
            label={translate("Show Coder")}
            onclick={evt => showWindow("coder")}
        />

        <MenuSeparator />

        <MenuItem 
            label={translate("Show developer tools")}
            onclick={showDevTools}
            shortcut="showDevTools"
        />
    </SubMenu>

    {#if electron}
        <SubMenu label={translate("Run")} icon="/icons/btn-runpy.svg" disabled={current.selection === undefined}>
            <MenuItem 
                label={translate("Toggle pilot mode")}
                onclick={togglePiloting}
                shortcut="togglePilot"
                disabled={current.selection === undefined}
            />

            <MenuSeparator />

            <MenuItem 
                label={current.runlist[current.selection]?.pilotMode ? translate("Pilot in Python") : translate("Run in Python")}
                icon="/icons/btn-{current.runlist[current.selection]?.pilotMode ? "pilot" : "run"}py.svg" 
                onclick={evt => current.awaiting.runpy = current.runlist[current.selection]?.runPython()}
                shortcut="runPython"
                disabled={current.selection === undefined}
            />
            <MenuItem
                label={current.runlist[current.selection]?.pilotMode ? translate("Pilot in browser") : translate("Run in browser")}
                icon="/icons/btn-{current.runlist[current.selection]?.pilotMode ? "pilot" : "run"}js.svg" 
                onclick={(evt) => current.awaiting.runjs = current.runlist[current.selection]?.runJS()}
                shortcut="runJS"
                disabled={current.selection === undefined}
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
            <MenuItem
                label="Install PsychoPy from Git"
                onclick={evt => show.psychopyBranchDlg = true}
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
        context={current.runlist}
        bind:shown={show.bugReport}
    />
{/if}
