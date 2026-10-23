<script>
    import callbacks from '../callbacks.svelte.js';
    import { getContext } from "svelte";
    import { Menu, MenuItem, MenuSeparator, SubMenu } from '$lib/utils/menu/frameMenu';
    import PrefsDialog from '$lib/dialogs/preferences/PrefsDialog.svelte';
    import ParamsDialog from "$lib/paramCtrls/ParamsDialog.svelte";
    import { FindDialog } from "$lib/dialogs/find";
    import { BugReportDlg } from "$lib/dialogs/bugReport";
    import { electron, python, git } from "$lib/globals.svelte";
    import { DeviceManagerDialog } from "$lib/dialogs/deviceManager/index.js";
    import { PluginManagerDlg, PsychoPyBranchDlg } from "$lib/dialogs/pluginManager";
    import BrowseDemosDlg from "$lib/pavlovia/browseProjects/BrowseDemosDlg.svelte";
    import { projectsLoaded, openProject } from "$lib/pavlovia/utils.svelte";
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
        deviceMgrDlg: false,
        pluginMgr: false,
        psychopyBranchDlg: false,
        bugReport: false,
        browseDemosDlg: false
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
            onclick={callbacks.new.fcn}
            disabled={callbacks.new.disabled}
        />
        <MenuItem 
            icon="/icons/btn-open.svg" 
            label={translate("Open file")} 
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
            label={translate("Save file as")}
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

        <MenuSeparator />

        <MenuItem
            icon="/icons/btn-settings.svg"
            label={translate("Preferences")}
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

    <SubMenu label={translate("Edit")} icon="/icons/rbn-edit.svg">
        <MenuItem 
            label={translate("Undo")}
            icon="/icons/btn-undo.svg"
            onclick={callbacks.undo.fcn}
            disabled={callbacks.undo.disabled}
            shortcut="undo"
        />
        <MenuItem 
            label={translate("Redo")}
            icon="/icons/btn-redo.svg"
            onclick={callbacks.redo.fcn}
            disabled={callbacks.redo.disabled}
            shortcut="redo"
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
            label={translate("Find in experiment")}
            icon="/icons/btn-find.svg"
            onclick={evt => show.findDlg = true}
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
            label={translate("Show Coder")}
            onclick={callbacks.showCoder.fcn}
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

    <SubMenu label={translate("Experiment")} icon="/icons/rbn-experiment.svg">
        <MenuItem 
            label={translate("Experiment settings")}
            icon="/icons/btn-settings.svg"
            onclick={evt => show.settingsDlg = true}
            disabled={!current.experiment.settings}
        />

        <MenuItem 
            label={translate("Show readme")}
            icon="/icons/btn-new.svg"
            onclick={evt => callbacks.showReadme.fcn()}
        />

        <MenuSeparator />

        <MenuItem 
            label={translate("Copy current Routine")}
            icon="/icons/btn-copy.svg"
            onclick={evt => callbacks.copyRoutine.fcn()}
        />

        <MenuItem 
            label={translate("Paste Routine")}
            icon="/icons/btn-paste.svg"
            onclick={evt => callbacks.pasteRoutine.fcn()}
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
                icon="/icons/btn-send{current.experiment.pilotMode ? "pilot" : "run"}.svg" 
                onclick={callbacks.sendToRunner.fcn}
                disabled={callbacks.sendToRunner.disabled}
                shortcut="sendToRunner"
            />

            <MenuSeparator />

            <MenuItem 
                label={translate("Compile Python")}
                icon="/icons/btn-compilepy.svg" 
                onclick={evt => callbacks.compilePython.fcn()}
                disabled={callbacks.compilePython.disabled}
                shortcut="compilePython"
            /> 
            <MenuItem 
                label={current.experiment.pilotMode ? translate("Pilot in Python") : translate("Run in Python")}
                icon="/icons/btn-{current.experiment.pilotMode ? "pilot" : "run"}py.svg" 
                onclick={evt => callbacks.runPython.fcn()}
                disabled={callbacks.runPython.disabled}
                shortcut="runPython"
            />

            <MenuSeparator />

            <MenuItem 
                label={translate("Compile JS")} 
                icon="/icons/btn-compilejs.svg" 
                onclick={(evt) => callbacks.compileJS.fcn()}
                disabled={callbacks.compileJS.disabled}
                shortcut="compileJS"
            />
            <MenuItem 
                label={current.experiment.pilotMode ? "Pilot in browser" : "Run in browser"}
                icon="/icons/btn-{current.experiment.pilotMode ? "pilot" : "run"}js.svg" 
                onclick={(evt) => callbacks.runJS.fcn()}
                disabled={callbacks.runJS.disabled}
                shortcut="runJS"
            />
        </SubMenu>
    {/if}

    <SubMenu label={translate("Demos")}>
        {#await projectsLoaded.promise then projects}
            {#each Object.keys(projects).filter(project => project.startsWith("demos/")) as project}
                <MenuItem 
                    label={project.split("/").at(-1)}
                    onclick={evt => openProject(projects[project])}
                />
            {/each}
            <MenuSeparator />
            <MenuItem 
                label={translate("Browse demos...")}
                onclick={evt => show.browseDemosDlg = true}
            />
        {/await}
    </SubMenu>

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
                onclick={callbacks.openUserFolder.fcn}
            />
        {/if}
        {#if python}
            <MenuItem 
                label={translate("Reinstall Python")}
                onclick={callbacks.reinstallPython.fcn}
            />
            <MenuItem
                label="Install PsychoPy from Git"
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
                        label={translate("Report bug")}
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
<FindDialog
    bind:shown={show.findDlg}
/>
{#await current.experiment.ready then}
    <ParamsDialog
        element={current.experiment.settings}
        bind:shown={show.settingsDlg}
    />
{:catch}
{/await}
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
<BrowseDemosDlg
    bind:shown={show.browseDemosDlg}
/>