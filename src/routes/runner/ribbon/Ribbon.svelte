<script>
    import callbacks from '../callbacks.svelte.js';
    
    import Menu from "./Menu.svelte";
    import { Ribbon, RibbonSection, RibbonGap } from '$lib/ui/ribbon';
    import { getContext } from "svelte";
    import { electron, python } from "$lib/globals.svelte.js";
    import { Button, SwitchButton } from '$lib/ui/button';
    import { UserCtrl } from '$lib/pavlovia';
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
        <Button
            icon="/icons/btn-new.svg" 
            tooltip={translate("New configuration")} 
            action="new"
            ghost
            tight
        />
        <Button
            icon="/icons/btn-open.svg" 
            tooltip={translate("Open configuration")} 
            action="openConfiguration"
            disabled={callbacks.open.disabled}
            ghost
            tight
        />
        <Button
            icon="/icons/btn-save.svg" 
            tooltip={translate("Save configuration")} 
            action="save"
            ghost
            tight
        />
        <Button
            icon="/icons/btn-saveas.svg" 
            tooltip={translate("Save configuration as")}
            action="saveAs"
            ghost
            tight
        />
    </RibbonSection>

    <RibbonSection label=Selection icon="/icons/rbn-experiment.svg">
        <SwitchButton 
            labels={["Pilot", "Run"]} 
            tooltip={current.runlist[current.selection]?.pilotMode ? translate("Experiment will run in pilot mode") : translate("Experiment will run in run mode")}
            bind:value={
                () => !current.runlist[current.selection]?.pilotMode,
                (value) => current.runlist[current.selection]?.setPilotMode(!value)
            } 
            disabled={callbacks.togglePiloting.disabled}
        />
        <Button
            icon="/icons/btn-send{current.runlist[current.selection]?.file.ext === ".psyexp" ? "builder" : "coder"}.svg" 
            tooltip={current.runlist[current.selection]?.file.ext === ".psyexp" ? translate("Open selection in Builder") : translate("Open selection in Coder")}
            action="openSelection"
            ghost
            tight
        />
    </RibbonSection>

    {#if python?.ready}
        <RibbonSection label=Run icon="/icons/btn-runpy.svg">
            <Button
                icon="/icons/btn-{current.runlist[current.selection]?.pilotMode ? "pilot" : "run"}py.svg" 
                tooltip={current.runlist[current.selection]?.pilotMode ? translate("Pilot experiment locally") : translate("Run experiment locally")}
                action="runPython"
                bind:awaiting={current.awaiting.runpy}
                cancel={callbacks.stopPython.fcn}
                ghost
                tight
            />
            <Button
                icon="/icons/btn-{current.runlist[current.selection]?.pilotMode ? "pilot" : "run"}js.svg" 
                tooltip={current.runlist[current.selection]?.pilotMode ? translate("Pilot experiment in browser") : translate("Run experiment in browser")} 
                action="runJS"
                bind:awaiting={current.awaiting.runjs}
                ghost
                tight
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
        <Button
            icon="/icons/btn-builder.svg" 
            tooltip={translate("Builder view")} 
            action="showBuilder"
            ghost
            tight
        />
        <Button
            icon="/icons/btn-coder.svg" 
            tooltip={translate("Coder view")} 
            action="showCoder"
            ghost
            tight
        />
        {#if electron}
            <Button
                icon="/icons/btn-runner.svg" 
                tooltip={translate("Runner view")} 
                action="showRunner"
                disabled
                ghost
                tight
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
