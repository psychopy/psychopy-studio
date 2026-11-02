<script>
    import callbacks from '../callbacks.svelte.js';
    import { getContext } from "svelte";
    import { Menu, MenuItem, MenuSeparator, SubMenu } from '$lib/ui/menu/frameMenu';
    import PrefsDialog from '$lib/dialogs/preferences/PrefsDialog.svelte';
    import { BugReportDlg } from "$lib/dialogs/bugReport";
    import { electron, python } from "$lib/globals.svelte";
    import { showDevTools } from "$lib/utils/views.svelte";
    import { DeviceManagerDialog } from "$lib/dialogs/deviceManager/index.js";
    import { PluginManagerDlg, PsychoPyBranchDlg } from "$lib/dialogs/pluginManager";
    import semver from "semver";
    import { translate } from "$lib/translation";


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
            onclick={window.close}
            role="close"
        />
        <MenuItem
            label={translate("Quit")}
            shortcut="quit"
            role="quit"
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
            label={translate("Show Coder")}
            onclick={callbacks.showCoder.fcn}
        />

        <MenuSeparator />

        <MenuItem 
            label={translate("Show developer tools")}
            onclick={showDevTools}
            disabled={callbacks.showDevTools.disabled}
            shortcut="showDevTools",
            role="toggleDevTools"
        />
    </SubMenu>

    {#if electron}
        <SubMenu label={translate("Run")} icon="/icons/btn-runpy.svg" disabled={current.selection === undefined}>
            <MenuItem 
                label={translate("Toggle pilot mode")}
                onclick={callbacks.togglePiloting.fcn}
                disabled={callbacks.togglePiloting.disabled}
                shortcut="togglePilot"
            />

            <MenuSeparator />

            <MenuItem 
                label={current.runlist[current.selection]?.pilotMode ? translate("Pilot in Python") : translate("Run in Python")}
                icon="/icons/btn-{current.runlist[current.selection]?.pilotMode ? "pilot" : "run"}py.svg" 
                onclick={callbacks.runPython.fcn}
                disabled={callbacks.runPython.disabled}
                shortcut="runPython"
            />
            <MenuItem
                label={current.runlist[current.selection]?.pilotMode ? translate("Pilot in browser") : translate("Run in browser")}
                icon="/icons/btn-{current.runlist[current.selection]?.pilotMode ? "pilot" : "run"}js.svg" 
                onclick={callbacks.runJS.fcn}
                disabled={callbacks.runJS.disabled}
                shortcut="runJS"
            />
        </SubMenu>
    {/if}

    <SubMenu label={translate("Tools")} icon="/icons/btn-hamburger.svg">
        <MenuItem 
            label={translate("Open device manager...")}
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
                label="Install PsychoPy from Git..."
                onclick={evt => show.psychopyBranchDlg = true}
            />
        {/if}

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
