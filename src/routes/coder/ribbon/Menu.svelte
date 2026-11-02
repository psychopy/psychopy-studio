<script>
    import callbacks from '../callbacks.svelte.js';
    import { getContext } from "svelte";
    import { Menu, MenuItem, MenuSeparator, SubMenu } from '$lib/ui/menu/frameMenu';
    import PrefsDialog from '$lib/dialogs/preferences/PrefsDialog.svelte';
    import { electron, python } from "$lib/globals.svelte";
    import { PluginManagerDlg, PsychoPyBranchDlg } from "$lib/dialogs/pluginManager";
    import { BugReportDlg } from "$lib/dialogs/bugReport";
    import semver from "semver";
    import Demos from "./Demos.svelte";
    import { translate } from "$lib/translation";

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
            onclick={callbacks.new.fcn}
            disabled={callbacks.new.disabled}
        />
        <MenuItem 
            icon="/icons/btn-open.svg" 
            label={translate("Open file...")} 
            shortcut="open"
            onclick={callbacks.open.fcn} 
            disabled={callbacks.open.disabled}
        />
        <MenuItem 
            icon="/icons/btn-open.svg" 
            label={translate("Open folder...")} 
            onclick={callbacks.folderOpen.fcn} 
        />
        <MenuItem 
            icon="/icons/btn-save.svg" 
            label={translate("Save file")}
            shortcut="save"
            onclick={callbacks.save.fcn} 
            disabled={callbacks.save.disabled}
        />
        <MenuItem 
            icon="/icons/btn-saveas.svg" 
            label={translate("Save file as...")}
            shortcut="saveAs"
            onclick={callbacks.saveAs.fcn} 
            disabled={callbacks.saveAs.disabled}
        />
        <MenuItem
            label={translate("Reveal in file explorer")}
            onclick={callbacks.revealFolder.fcn}
            disabled={callbacks.revealFolder.disabled}
            shortcut="revealFolder"
        />
        <MenuItem
            label={translate("Close window")}
            onclick={window.close}
            shortcut="close"
        />

        <MenuSeparator />

        <MenuItem
            icon="/icons/btn-settings.svg"
            label={translate("Preferences...")}
            onclick={(evt) => {show.prefsDlg = true}}
        />
        <MenuItem
            label={translate("Reset preferences")}
            onclick={callbacks.resetPrefs.fcn}
        />

        <MenuSeparator />

        <MenuItem
            label={translate("Minimize window")}
            role="minimize"
        />
        <MenuItem
            label={translate("Close window")}
            onclick={close}
            disabled={callbacks.close.disabled}
            role="close"
        />
        <MenuItem
            label={translate("Quit")}
            shortcut="quit"
            role="quit"
        />
    </SubMenu>

    <SubMenu label={translate("Edit")} icon="/icons/rbn-edit.svg">
        <MenuItem 
            label={translate("Undo")}
            icon="/icons/btn-undo.svg"
            onclick={callbacks.undo.fcn}
            disabled={callbacks.undo.disabled}
            shortcut="undo"
            role="undi"
        />
        <MenuItem 
            label={translate("Redo")}
            icon="/icons/btn-redo.svg"
            onclick={callbacks.redo.fcn}
            disabled={callbacks.redo.disabled}
            shortcut="redo"
            role="redo"
        />

        <MenuSeparator />

        <MenuItem 
            label={translate("Cut text")}
            icon="/icons/btn-cut.svg"
            role="cut"
        />
        <MenuItem 
            label={translate("Copy text")}
            icon="/icons/btn-copy.svg"
            role="copy"
        />
        <MenuItem 
            label={translate("Paste text")}
            icon="/icons/btn-paste.svg"
            role="paste"
        />

        <MenuSeparator />

        <MenuItem 
            label={translate("Find...")}
            icon="/icons/btn-find.svg"
            onclick={callbacks.find.fcn}
            disabled={callbacks.find.disabled}
            shortcut="find"
        />
    </SubMenu>

    <SubMenu label={translate("View")} icon="/icons/rbn-windows.svg">
        <MenuItem 
            label={translate("Reload window")}
            role="reload"
        />
        <MenuItem 
            label={translate("Force reload window")}
            role="forceReload"
        />

        <MenuSeparator />

        <MenuItem
            label={translate("Zoom in")}
            role="zoomIn"
        />
        <MenuItem
            label={translate("Zoom out")}
            role="zoomOut"
        />
        <MenuItem
            label={translate("Reset zoom")}
            role="resetZoom"
        />

        <MenuSeparator />

        <MenuItem 
            label={translate("Show Builder")}
            onclick={callbacks.showBuilder.fcn}
        />
        <MenuItem 
            label={translate("Show Runner")}
            onclick={callbacks.showRunner.fcn}
        />

        <MenuSeparator />

        <MenuItem 
            label={translate("Show developer tools")}
            onclick={callbacks.showDevTools.fcn}
            disabled={callbacks.showDevTools.disabled}
            shortcut="showDevTools"
            role="toggleDevTools"
        />
    </SubMenu>

    {#if electron}
        <SubMenu label={translate("Run")} icon="/icons/btn-runpy.svg">
            <MenuItem 
                label={translate("Toggle pilot mode")}
                onclick={callbacks.togglePiloting.fcn}
                disabled={callbacks.togglePiloting.disabled}
                shortcut="togglePilot"
            />
            <MenuItem 
                label={translate("Send to Runner")}
                icon="/icons/btn-send{current.pages[current.tab]?.pilotMode ? "pilot" : "run"}.svg" 
                onclick={callbacks.sendToRunner.fcn}
                disabled={callbacks.sendToRunner.disabled}
                shortcut="sendToRunner"
            />

            <MenuSeparator />

            <MenuItem 
                label={current.pages[current.tab]?.pilotMode ? translate("Pilot in Python") : translate("Run in Python")}
                icon="/icons/btn-{current.pages[current.tab]?.pilotMode?.pilotMode ? "pilot" : "run"}py.svg" 
                onclick={evt => callbacks.runPython.fcn()}
                disabled={callbacks.runPython.disabled}
                shortcut="runPython"
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
                onclick={callbacks.openUserFolder.fcn}
            />
        {/if}
        {#if python}
            <MenuItem 
                label={translate("Reinstall Python")}
                onclick={callbacks.reinstallPython.fcn}
            />
            <MenuItem
                label="Install PsychoPy from Git..."
                onclick={evt => show.psychopyBranchDlg = true}
            />
        {/if}
    </SubMenu>

    <SubMenu label={translate("Help")}>
        <MenuItem
            label={translate("App info")}
            role="about"
        />
        <MenuItem 
            label={translate("PsychoPy Homepage")}
            onclick={callbacks.gotoHomepage.fcn}
        />
        <MenuItem 
            label={translate("Documentation")}
            onclick={callbacks.gotoDocumentation.fcn}
        />
        <MenuItem 
            label={translate("Help Forum")}
            onclick={callbacks.gotoForum.fcn}
        />
        <MenuSeparator />
        {#if electron}
            {#await electron.version() then version}
                <MenuItem
                    label="{translate("PsychoPy")} {version}"
                    disabled
                />
                {#if version === "dev" || semver.parse(version).extra}
                    <MenuSeparator />
                    
                    <MenuItem
                        label={translate("Report bug...")}
                        onclick={evt => show.bugReport = true}
                    />
                {/if}
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
