<script>
    import {
        // file
        fileNew,
        fileOpen,
        fileSave,
        fileSaveAs,
        // edit
        undo,
        redo,
        find,
        // experiment
        sendToRunner,
        // run
        runPython,
        stopPython,
        // views
        showWindow
    } from '../callbacks.svelte.js'
    
    import { Ribbon, RibbonSection, RibbonGap } from '$lib/utils/ribbon';
    import Menu from "./Menu.svelte";
    import { getContext } from "svelte";
    import { IconButton, SwitchButton } from '$lib/utils/buttons';
    import { UserCtrl } from '$lib/pavlovia';
    import { electron, python } from "$lib/globals.svelte";
    import { translate } from "$lib/translation";

    let current = getContext("current");

    let show = $state({
    })

    let awaiting = $state({
        runpy: Promise.resolve(false)
    })
</script>

<Ribbon>
    <Menu 
        bind:shown={show.menu} 
    />
    
    <RibbonSection label={translate("File")} icon="/icons/rbn-file.svg">
        <IconButton 
            icon="/icons/btn-new.svg" 
            label={translate("New file")} 
            onclick={fileNew}
            borderless
        /> 
        <IconButton 
            icon="/icons/btn-open.svg" 
            label={translate("Open file")} 
            onclick={fileOpen} 
            borderless
        />
        <IconButton 
            icon="/icons/btn-save.svg" 
            label={translate("Save file")} 
            onclick={fileSave}
            borderless
            disabled={
                Object.values(current.pages).length === 0 ||
                (!current.pages[current.tab]?.canUndo && current.pages[current.tab]?.file?.file)
            }
        />
        <IconButton 
            icon="/icons/btn-saveas.svg" 
            label={translate("Save file as")}
            onclick={fileSaveAs} 
            borderless
            disabled={Object.values(current.pages).length === 0}
        />
    </RibbonSection>

    <RibbonSection label={translate("Edit")} icon="/icons/rbn-edit.svg">
        <IconButton 
            icon="/icons/btn-undo.svg" 
            label={translate("Undo")}
            onclick={undo} 
            disabled={!current.pages[current.tab]?.canUndo} 
            borderless
        />
        <IconButton 
            icon="/icons/btn-redo.svg" 
            label={translate("Redo")} 
            onclick={redo} 
            disabled={!current.pages[current.tab]?.canRedo} 
            borderless
        />
        <IconButton 
            icon="/icons/btn-find.svg" 
            label={translate("Find")} 
            onclick={find}
            disabled={!current.pages[current.tab]?.editor}
            borderless
        />
    </RibbonSection>

    <RibbonSection label={translate("Experiment")} icon="/icons/rbn-experiment.svg">
        <SwitchButton 
            labels={["Pilot", "Run"]} 
            tooltip={current.pages[current.tab]?.pilotMode ? "Experiment will run in pilot mode" : "Experiment will run in run mode"}
            bind:value={
                () => !current.pages[current.tab]?.pilotMode,
                (value) => current.pages[current.tab].setPilotMode(!value)
            } 
            disabled={!current.pages[current.tab]}
        />
        
        {#if python?.ready}
            <IconButton 
                icon="/icons/btn-send{current.pages[current.tab]?.pilotMode ? "pilot" : "run"}.svg" 
                label={translate("Send experiment to runner")} 
                onclick={sendToRunner}
                disabled={!current.pages[current.tab]?.file?.file}
                borderless
            /> 
        {/if}
    </RibbonSection>
    {#if python?.ready}
        <RibbonSection label={translate("Run")} icon="/icons/btn-runpy.svg">
            <IconButton 
                icon="/icons/btn-{current.pages[current.tab]?.pilotMode ? "pilot" : "run"}py.svg" 
                label={current.pages[current.tab]?.pilotMode ? translate("Pilot locally") : translate("Run locally")}
                onclick={evt => runPython()}
                disabled={
                    !current.pages[current.tab]?.file?.file || 
                    !current.pages[current.tab]?.file?.parent || 
                    current.pages[current.tab]?.file?.ext !== ".py"
                }
                bind:awaiting={awaiting.runpy}
                cancel={evt => stopPython()}
                borderless
            /> 
        </RibbonSection>
    {/if}

    <RibbonSection label={translate("Pavlovia")} icon="/icons/rbn-pavlovia.svg">
        <div class=padded>
            <UserCtrl />
        </div>
    </RibbonSection>

    <RibbonGap></RibbonGap>

    <RibbonSection label={translate("Views")} icon="/icons/rbn-windows.svg">
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
            disabled
        />
        {#if electron}
            <IconButton 
                icon="/icons/btn-runner.svg" 
                label={translate("Runner view")} 
                onclick={(evt) => showWindow("runner")} 
                borderless
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
