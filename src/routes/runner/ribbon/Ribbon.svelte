<script>
    import {
        // file
        fileNew,
        fileOpen,
        fileSave,
        fileSaveAs,
        // view
        showWindow,
    } from '../callbacks.svelte.js'
    
    import Menu from "./Menu.svelte";
    import { Ribbon, RibbonSection, RibbonGap } from '$lib/utils/ribbon';
    import { getContext } from "svelte";
    import { electron, python } from "$lib/globals.svelte.js";
    import { IconButton, SwitchButton } from '$lib/utils/buttons';
    import { UserCtrl } from '$lib/pavlovia';
    import { Experiment } from "$lib/experiment";
    import { openIn } from "$lib/utils/views.svelte";
    import { translate } from "$lib/translation";

    let current = getContext("current");

    let {
        selection
    } = $props()

    let show = $state({
        menu: false,
        settingsDlg: false,
        findDlg: false,
        deviceMgrDlg: false,
    })
</script>

<Ribbon>
    <Menu 
        bind:shown={show.menu} 
    />
    
    <RibbonSection label=File icon="/icons/rbn-file.svg">
        <IconButton 
            icon="/icons/btn-new.svg" 
            label={translate("New configuration")} 
            onclick={(evt) => fileNew()} 
            borderless
        />
        <IconButton 
            icon="/icons/btn-open.svg" 
            label={translate("Open configuration")} 
            onclick={(evt) => fileOpen(true).catch(err => console.error(err))} 
            borderless
        />
        <IconButton 
            icon="/icons/btn-save.svg" 
            label={translate("Save configuration")} 
            onclick={fileSave}
            borderless
        />
        <IconButton 
            icon="/icons/btn-saveas.svg" 
            label={translate("Save configuration as")}
            onclick={fileSaveAs} 
            borderless
        />
    </RibbonSection>

    <RibbonSection label=Selection icon="/icons/rbn-experiment.svg">
        <SwitchButton 
            labels={["Pilot", "Run"]} 
            tooltip={current.runlist[current.selection]?.pilotMode ? translate("Experiment will run in pilot mode") : translate("Experiment will run in run mode")}
            bind:value={
                () => current.runlist[current.selection]?.pilotMode,
                (value) => current.runlist[current.selection]?.setPilotMode(value)
            } 
            disabled={current.selection === undefined}
        />
        <IconButton 
            icon="/icons/btn-send{current.runlist[current.selection]?.file.ext === ".psyexp" ? "builder" : "coder"}.svg" 
            label={current.runlist[current.selection]?.file.ext === ".psyexp" ? translate("Open selection in Builder") : translate("Open selection in Coder")}
            onclick={evt => openIn(
                current.runlist[current.selection]?.file.file, 
                current.runlist[current.selection]?.file.ext === ".psyexp" ? "builder" : "coder"
            )} 
            borderless
            disabled={!current.runlist[current.selection]}
        />
    </RibbonSection>

    {#if python?.ready}
        <RibbonSection label=Run icon="/icons/btn-runpy.svg">
            <IconButton 
                icon="/icons/btn-{current.runlist[current.selection]?.pilotMode ? "pilot" : "run"}py.svg" 
                label={current.runlist[current.selection]?.pilotMode ? translate("Pilot experiment locally") : translate("Run experiment locally")}
                onclick={evt => current.runlist[current.selection]?.runPython()}
                disabled={current.selection === undefined}
                bind:awaiting={current.awaiting.runpy}
                cancel={python.scripts.stop}
                borderless
            />
            <IconButton 
                icon="/icons/btn-{current.runlist[current.selection]?.pilotMode ? "pilot" : "run"}js.svg" 
                label={current.runlist[current.selection]?.pilotMode ? translate("Pilot experiment in browser") : translate("Run experiment in browser")} 
                onclick={(evt) => current.runlist[current.selection]?.runJS()}
                disabled={current.selection === undefined || !(current.runlist[current.selection] instanceof Experiment)}
                bind:awaiting={current.awaiting.runjs}
                borderless
            />
        </RibbonSection>
    {/if}

    <RibbonSection label=Pavlovia icon="/icons/rbn-pavlovia.svg">
        <div class=padded>
            <UserCtrl />
        </div>
    </RibbonSection>

    <RibbonGap></RibbonGap>

    <RibbonSection label=Views icon="/icons/rbn-windows.svg">
        <IconButton 
            icon="/icons/btn-builder.svg" 
            label={translate("Builder view")} 
            onclick={(evt) => showWindow("builder")} 
            borderless
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
                disabled
            />
        {/if}
    </RibbonSection>
</Ribbon>

<style>
    .padded {
        display: flex;
        padding: .25rem;
    }
</style>
