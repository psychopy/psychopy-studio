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
            action="new"
        />
        <MenuItem 
            icon="/icons/btn-open.svg" 
            label={translate("Open file...")} 
            action="open"
        />
        <MenuItem 
            icon="/icons/btn-open.svg" 
            label={translate("Open folder...")} 
            action="folderOpen"
        />
        <MenuItem 
            icon="/icons/btn-save.svg" 
            label={translate("Save file")}
            action="save"
        />
        <MenuItem 
            icon="/icons/btn-saveas.svg" 
            label={translate("Save file as...")}
            action="saveAs"
        />
        <MenuItem
            label={translate("Reveal in file explorer")}
            action="revealFolder"
        />
        <MenuItem
            label={translate("Close window")}
            action="close"
        />

        <MenuSeparator />

        <MenuItem
            icon="/icons/btn-settings.svg"
            label={translate("Preferences...")}
            onclick={(evt) => {show.prefsDlg = true}}
        />
        <MenuItem
            label={translate("Reset preferences")}
            action="resetPrefs"
        />

        <MenuSeparator />

        <MenuItem
            label={translate("Minimize window")}
            action="minimize"
        />
        <MenuItem
            label={translate("Close window")}
            action="close"
        />
        <MenuItem
            label={translate("Quit")}
            action="quit"
        />
    </SubMenu>

    <SubMenu label={translate("Edit")} icon="/icons/rbn-edit.svg">
        <MenuItem 
            label={translate("Undo")}
            icon="/icons/btn-undo.svg"
            action="undo"
        />
        <MenuItem 
            label={translate("Redo")}
            icon="/icons/btn-redo.svg"
            action="redo"
        />

        <MenuSeparator />

        <MenuItem 
            label={translate("Cut text")}
            icon="/icons/btn-cut.svg"
            action="cut"
        />
        <MenuItem 
            label={translate("Copy text")}
            icon="/icons/btn-copy.svg"
            action="copy"
        />
        <MenuItem 
            label={translate("Paste text")}
            icon="/icons/btn-paste.svg"
            action="paste"
        />

        <MenuSeparator />

        <MenuItem 
            label={translate("Find...")}
            icon="/icons/btn-find.svg"
            action="find"
        />
    </SubMenu>

    <SubMenu label={translate("View")} icon="/icons/rbn-windows.svg">
        <MenuItem 
            label={translate("Reload window")}
            action="reload"
        />
        <MenuItem 
            label={translate("Force reload window")}
            action="forceReload"
        />

        <MenuSeparator />

        <MenuItem
            label={translate("Zoom in")}
            action="zoomIn"
        />
        <MenuItem
            label={translate("Zoom out")}
            action="zoomOut"
        />
        <MenuItem
            label={translate("Reset zoom")}
            action="resetZoom"
        />

        <MenuSeparator />

        <MenuItem 
            label={translate("Show Builder")}
            action="showBuilder"
        />
        <MenuItem 
            label={translate("Show Runner")}
            action="showRunner"
        />

        <MenuSeparator />

        <MenuItem 
            label={translate("Show developer tools")}
            action="showDevTools"
        />
    </SubMenu>

    {#if electron}
        <SubMenu label={translate("Run")} icon="/icons/btn-runpy.svg">
            <MenuItem 
                label={translate("Toggle pilot mode")}
                action="togglePiloting"
            />
            <MenuItem 
                label={translate("Send to Runner")}
                icon="/icons/btn-send{current.pages[current.tab]?.pilotMode ? "pilot" : "run"}.svg" 
                action="sendToRunner"
            />

            <MenuSeparator />

            <MenuItem 
                label={current.pages[current.tab]?.pilotMode ? translate("Pilot in Python") : translate("Run in Python")}
                icon="/icons/btn-{current.pages[current.tab]?.pilotMode?.pilotMode ? "pilot" : "run"}py.svg" 
                action="runPython"
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
                action="openUserFolder"
            />
        {/if}
        {#if python}
            <MenuItem 
                label={translate("Reinstall Python")}
                action="reinstallPython"
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
            action="about"
        />
        <MenuItem 
            label={translate("PsychoPy Homepage")}
            action="gotoHomepage"
        />
        <MenuItem 
            label={translate("Documentation")}
            action="gotoDocumentation"
        />
        <MenuItem 
            label={translate("Help Forum")}
            action="gotoForum"
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
