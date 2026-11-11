<script>
    import callbacks from '../callbacks.svelte.js';
    import { getContext } from "svelte";
    import { Menu, MenuItem, MenuSeparator, SubMenu } from '$lib/ui/menu/frameMenu';
    import { dialogsOpen } from "$lib/ui/dialog";
    import PrefsDialog from '$lib/dialogs/preferences/PrefsDialog.svelte';
    import ParamsDialog from "$lib/ui/paramCtrls/ParamsDialog.svelte";
    import { FindDialog } from "$lib/dialogs/find";
    import { BugReportDlg } from "$lib/dialogs/bugReport";
    import { electron, python, git } from "$lib/globals.svelte";
    import { DeviceManagerDialog } from "$lib/dialogs/deviceManager/index.js";
    import { PluginManagerDlg, PsychoPyBranchDlg } from "$lib/dialogs/pluginManager";
    import { BrowseDemosDlg } from "$lib/pavlovia/demos";
    import { SearchProjectsDlg } from "$lib/pavlovia/search";
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
        browseDemosDlg: false,
        searchProjectsDlg: false
    });

    let anyDialogOpen = $derived(Object.values(dialogsOpen).some(val => val))
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
            action="new"
        />
        <MenuItem 
            icon="/icons/btn-open.svg" 
            label={translate("Open file...")} 
            action="open"
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
            disabled={anyDialogOpen ? false : undefined}
            action="undo"
        />
        <MenuItem 
            label={translate("Redo")}
            icon="/icons/btn-redo.svg"
            disabled={anyDialogOpen ? false : undefined}
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
            label={translate("Find in experiment...")}
            icon="/icons/btn-find.svg"
            onclick={evt => show.findDlg = true}
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
            label={translate("Show Coder")}
            action="showCoder"
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

    <SubMenu label={translate("Experiment")} icon="/icons/rbn-experiment.svg">
        <MenuItem 
            label={translate("Experiment settings...")}
            icon="/icons/btn-settings.svg"
            onclick={evt => show.settingsDlg = true}
            disabled={!current.experiment.settings}
        />

        <MenuItem 
            label={translate("Show readme")}
            icon="/icons/btn-new.svg"
            action="showReadme"
        />

        <MenuSeparator />

        <MenuItem 
            label={translate("Copy current Routine")}
            icon="/icons/btn-copy.svg"
            action="copyRoutine"
        />

        <MenuItem 
            label={translate("Paste Routine")}
            icon="/icons/btn-paste.svg"
            action="pasteRoutine"
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
                icon="/icons/btn-send{current.experiment.pilotMode ? "pilot" : "run"}.svg" 
                action="sendToRunner"
            />

            <MenuSeparator />

            <MenuItem 
                label={translate("Compile Python")}
                icon="/icons/btn-compilepy.svg" 
                action="compilePython"
            /> 
            <MenuItem 
                label={current.experiment.pilotMode ? translate("Pilot in Python") : translate("Run in Python")}
                icon="/icons/btn-{current.experiment.pilotMode ? "pilot" : "run"}py.svg" 
                action="runPython"
            />

            <MenuSeparator />

            <MenuItem 
                label={translate("Compile JS")} 
                icon="/icons/btn-compilejs.svg" 
                action="compileJS"
            />
            <MenuItem 
                label={current.experiment.pilotMode ? "Pilot in browser" : "Run in browser"}
                icon="/icons/btn-{current.experiment.pilotMode ? "pilot" : "run"}js.svg" 
                action="runJS"
            />
        </SubMenu>
    {/if}


    <SubMenu label={translate("Pavlovia")}>
        {#if !current.project}
            <MenuItem
                label={translate("New project...")}
                icon="/icons/btn-add.svg"
                onclick={evt => show.newProjectDlg = true}
                disabled={!current.user || !current.experiment?.file?.file}
            />
        {/if}
        <MenuItem
            label={translate("Edit project")}
            icon="/icons/btn-edit.svg"
            onclick={evt => window.open(`${current.project.web_url}/edit`, "_blank")}
            disabled={!current.project}
        />
        <MenuSeparator/>
        <MenuItem 
            label={translate("Browse demos...")}
            icon="/icons/btn-demos.svg" 
            onclick={evt => show.browseDemosDlg = true}
            borderless
        />
        <MenuItem
            label={translate("Search projects...")}
            icon="/icons/btn-find.svg"
            onclick={(evt) => show.searchProjectsDlg = true}
        />
    </SubMenu>

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
        {/if}

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
<SearchProjectsDlg
    bind:shown={show.searchProjectsDlg}
/>