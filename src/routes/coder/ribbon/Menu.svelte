<script>
    import { getContext } from "svelte";
    import { Menu, MenuItem, MenuSeparator, SubMenu } from '$lib/utils/menu/frameMenu';
    import PrefsDialog from '$lib/dialogs/preferences/PrefsDialog.svelte';
    import { prefs } from "$lib/preferences.svelte"; 
    import { electron, python } from "$lib/globals.svelte";
    import { PluginManagerDlg, PsychoPyBranchDlg } from "$lib/dialogs/pluginManager";
    import { BugReportDlg } from "$lib/dialogs/bugReport";
    import { setupPython } from "$lib/python";
    import { Version } from "$lib/utils/versions";
    import Demos from "./Demos.svelte";
    import { translate } from "$lib/translation";

    import {
        // file
        fileNew,
        fileOpen,
        fileSave,
        fileSaveAs,
        revealFolder,
        quit,
        // edit
        undo,
        redo,
        find,
        // view
        // newWindow,
        showWindow,
        showDevTools,
        // // experiment
        // copyRoutine,
        // pasteRoutine,
        // // run
        togglePiloting,
        sendToRunner,
        runPython,
        runJS
    } from '../callbacks.svelte.js';
    import { join } from "path-browserify";

    let current = getContext("current");

    let {
        shown=$bindable()
    } = $props()

    let show = $state({
        prefsDlg: false,
        deviceMgrDlg: false,
        pluginMgr: false,
        psychopyBranchDlg: false,
        bugReport: false
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
            disabled={
                Object.values(current.pages).length === 0 ||
                (!current.pages[current.tab]?.canUndo && current.pages[current.tab]?.file?.file)
            }
        />
        <MenuItem 
            icon="/icons/btn-saveas.svg" 
            label={translate("Save file as")}
            shortcut="saveAs"
            onclick={fileSaveAs} 
            disabled={Object.values(current.pages).length === 0}
        />
        <MenuItem
            label={translate("Reveal in file explorer")}
            onclick={revealFolder}
            shortcut="revealFolder"
            disabled={current.pages[current.tab]?.file?.parent === undefined}
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

    <SubMenu label={translate("Edit")} icon="/icons/rbn-edit.svg">
        <MenuItem 
            label={translate("Undo")}
            icon="/icons/btn-undo.svg"
            disabled={!current.pages[current.tab]?.canUndo}
            onclick={undo}
            shortcut="undo"
        />
        <MenuItem 
            label={translate("Redo")}
            icon="/icons/btn-redo.svg"
            onclick={redo}
            disabled={!current.pages[current.tab]?.redo}
            shortcut="redo"
        />
        <MenuSeparator />
        <MenuItem 
            label={translate("Find")}
            icon="/icons/btn-find.svg"
            onclick={find}
            disabled={!current.pages[current.tab]?.editor}
            shortcut="find"
        />
    </SubMenu>

    <SubMenu label={translate("View")} icon="/icons/rbn-windows.svg">
        <MenuItem 
            label={translate("Show Builder")}
            onclick={evt => showWindow("builder")}
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

    {#if electron}
        <SubMenu label={translate("Run")} icon="/icons/btn-runpy.svg">
            <MenuItem 
                label={translate("Toggle pilot mode")}
                onclick={togglePiloting}
                shortcut="togglePilot"
                disabled={!current.pages[current.tab]}
            />
            <MenuItem 
                label={translate("Send to Runner")}
                icon="/icons/btn-send{current.pages[current.tab]?.pilotMode ? "pilot" : "run"}.svg" 
                onclick={sendToRunner}
                shortcut="sendToRunner"
                disabled={!current.pages[current.tab]}
            />

            <MenuSeparator />

            <MenuItem 
                label={current.pages[current.tab]?.pilotMode ? translate("Pilot in Python") : translate("Run in Python")}
                icon="/icons/btn-{current.pages[current.tab]?.pilotMode?.pilotMode ? "pilot" : "run"}py.svg" 
                onclick={evt => runPython()}
                shortcut="runPython"
                disabled={!current.pages[current.tab] || current.pages[current.tab].file.ext !== ".py"}
            />

        </SubMenu>
    {/if}

    <SubMenu label={translate("Demos")}>
        <Demos />
    </SubMenu>

    <SubMenu label={translate("Tools")} icon="/icons/btn-hamburger.svg">
        <MenuItem 
            label={translate("Manage plugins and packages")}
            icon="/icons/btn-plugin.svg"
            onclick={evt => show.pluginMgr = true}
            disabled={!python?.ready}
        />
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
        context={current.pages}
        bind:shown={show.bugReport}
    />
{/if}
