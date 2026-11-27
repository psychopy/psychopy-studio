<script>
    import { Button } from "$lib/ui/button";
    import { Menu, MenuItem} from '$lib/ui/menu';
    import callbacks from "../callbacks.svelte.js";
    import Component from './Component.svelte';
    import TimelineHeader from './Timeline.svelte';
    import EntryPoint from './EntryPoint.svelte';
    import ParamsDialog from "$lib/ui/paramCtrls/ParamsDialog.svelte";
    import { translate } from "$lib/translation";

    let {
        routine=undefined
    } = $props()

    let show = $state({
        paramsDlg: false,
        alertsDlg: false
    })

    let contextMenu = $state({
        show: false,
        pos: {
            x: undefined,
            y: undefined
        }
    })

    // update reference in Experiment when this Routine is renamed
    $effect(() => {
        if (routine.exp) {
            routine.exp.renameRoutine(
                routine, 
                $state.snapshot(routine.settings.params['name'].val)
            )
        }
    })
</script>

<div 
    class=routine-canvas
    style:grid-template-rows="min-content [timeline-top] min-content {routine.components.length ? `repeat(${routine.components.length}, min-content)` : ""} [timeline-bottom] min-content [timeline-end] 1fr"
>
    <div class=button-container>
        <Button 
            label={translate("Routine settings")}
            icon="/icons/btn-settings.svg"
            tooltip={translate("Edit settings for this Routine")}
            onclick={() => show.paramsDlg = true}
            horizontal 
        />
    </div>

    <ParamsDialog
        element={routine.settings}
        bind:shown={show.paramsDlg}
    />

    {#if routine.components}
        <TimelineHeader routine={routine} />
    {/if}

    {#each routine.components as component}
        <Component component={component} />
    {/each}
    <EntryPoint routine={routine} index=-1 />
    <div 
        class=context-target
        style:grid-row-start={"timeline-end"}
        style:grid-column-start={"entrypoints"}
        style:grid-column-end={"end"}
        oncontextmenu={evt => {
            evt.preventDefault();
            // show menu
            contextMenu.show = true;
            // set its position to the mouse pos
            contextMenu.pos.x = evt.pageX;
            contextMenu.pos.y = evt.pageY;
        }}
        role="none"
    ></div>
    <Menu 
        bind:shown={contextMenu.show} 
        bind:position={contextMenu.pos}
    >
        <MenuItem
            icon="/icons/btn-paste.svg"
            label={translate("Paste Component")}
            onclick={evt => callbacks.pasteComponent.fcn(routine, 0)}
        />
    </Menu>
</div>

<style>
    .routine-canvas {
        display: grid;
        grid-template-columns: [entrypoints] 1rem [name] min-content [undershoot] 3rem [timeline] 1fr [overshoot] 3rem [end];
        grid-gap: 0;
        padding-bottom: 2rem;
        height: 100%;
        box-sizing: border-box;
    }
    .button-container {
        display: flex;
        flex-direction: row;
        justify-content: start;
        align-items: center;
        gap: .5rem;
        grid-column-start: entrypoints;
        grid-column-end: end;
        justify-self: start;
        margin: .5rem;
        z-index: 2;
    }
</style>