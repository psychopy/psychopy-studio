<script>
    import Dialog from '$lib/ui/dialog/Dialog.svelte';
    import { DialogButton } from '$lib/ui/dialog';
    import { Menu, MenuItem } from "$lib/ui/menu"
    import { ParamsNotebook } from '$lib/ui/paramCtrls/index.js';
    import { FlowLoop } from "$lib/experiment/flow.svelte.js";
    import Loop from "./Loop.svelte"
    import RoutineNode from './Routine.svelte';
    import EntryPoint from './EntryPoint.svelte'
    import { getContext } from "svelte";
    import { Icon } from "$lib/ui/icon";
    
    let current = getContext("current");

    let {
        element=$bindable()
    } = $props()

    let showDialog = $state(false);

    let showContextMenu = $state(false);
    let contextMenuPos = $state({
        x: undefined,
        y: undefined
    });

    function removeLoop(evt) {
        // update history
        current.experiment.history.update(`remove ${element.name}`);
        // remove from flow
        current.experiment.flow.removeLoop(element.initiator);
    }

    let edgeHovered = $state({
        left: false,
        right: false
    })

    let valid = $derived(
        Object.values(element.params).every(
            param => param.valid?.value
        )
    )

    let btnsDisabled = $derived({
        OK: !valid,
        APPLY: !valid
    })
</script>

{#if element.complete}
    <EntryPoint index={element.initiator.index} />
{/if}
<div class=loop class:incomplete={!element.complete}>
    {#if element}
        <button
            class=loop-name
            onclick={(evt) => showDialog = true}
            oncontextmenu={(evt) => {
                evt.preventDefault();
                // show menu
                showContextMenu = true;
                // set its position to the mouse pos
                contextMenuPos.x = evt.pageX;
                contextMenuPos.y = evt.pageY;
            }}
        >
            {element.name}
        </button>
        
    {/if}
    <div 
        class="loop-arrow left"
        ondragstart={() => current.moving = element.initiator} 
        ondragend={() => current.moving = undefined}
        onmouseenter={() => edgeHovered.left = true}
        onmouseleave={() => edgeHovered.left = false}
        draggable={true}
        role=none
    >
        <Icon 
            src="/icons/sym-arrow-up{edgeHovered.left ? "-hl" : ""}.svg"
        />
    </div>
    {#if element}
        {#each Object.keys(element.routines) as i}
            {#if element.routines[i] instanceof FlowLoop}
                <Loop bind:element={element.routines[i]} />
            {:else}
                <RoutineNode bind:element={element.routines[i].element} index={element.routines[i].index} />
            {/if}
        {/each}
    {/if}
    {#if element.complete}
        <div 
            class="loop-arrow right"
            ondragstart={() => current.moving = element.terminator} 
            ondragend={() => current.moving = undefined} 
            onmouseenter={() => edgeHovered.right = true}
            onmouseleave={() => edgeHovered.right = false}
            draggable={true}
            role=none
        >
            <Icon 
                src="/icons/sym-arrow-down{edgeHovered.right ? "-hl" : ""}.svg"
            />
        </div>
        <EntryPoint index={element.terminator.index} />
    {/if}
</div>

<!-- menu to open when right clicked on -->
<Menu 
    bind:shown={showContextMenu} 
    bind:position={contextMenuPos}
>
    <MenuItem 
        icon="/icons/btn-delete.svg"
        label="Delete Loop"
        onclick={removeLoop}
    />
</Menu>

<!-- dialog to open when clicked on -->
<Dialog 
    data-testid="loop-{element.name}" 
    title={element.name}
    bind:shown={showDialog} 
    onopen={() => element.initiator.restore.set()}
>
    <ParamsNotebook 
        element={
            element instanceof FlowLoop ? element.initiator : element
        } 
        bind:valid={valid}
    />
    {#snippet buttons()}
        <DialogButton
            action=OK
            disabled={btnsDisabled.OK}
        />
        <DialogButton
            action=APPLY
            onclick={(evt) => element.initiator.restore.set()}
            disabled={btnsDisabled.APPLY}
        />
        <DialogButton
            action=CANCEL
            onclick={(evt) => element.initiator.restore.apply()}
        />
    {/snippet}
</Dialog>

<style>
    .loop {
        position: relative;
        display: flex;
        flex-direction: row;
        align-items: start;
        gap: 1rem;
        border: 1px solid var(--outline);
        border-radius: 1rem;
        padding: 0 1rem;
        padding-top: 0;
        min-height: 4rem;
        margin-bottom: 3rem;
    }
    .loop .loop-name {
        position: absolute;
        line-height: 1rem;
        bottom: 0;
        left: 50%;
        transform: translate(-50%, 50%);
        padding: .5rem 1rem;
        background-color: var(--outline);
        color: var(--text-on-outline);
        border: 1px solid var(--outline);
        border-radius: 1rem;
        box-shadow: 
            inset -1px -1px 2px rgba(0, 0, 0, 0.05)
        ;
    }
    .loop .loop-name:enabled:focus,
    .loop .loop-name:enabled:hover {
        box-shadow: 
            inset 1px 1px 10px rgba(0, 0, 0, 0.25)
        ;
        border-color: var(--blue);
    }
    .loop-arrow {
        width: .75rem;
        position: absolute;
        right: 100%;
        top: 50%;
        transform: translateX(calc(50% - .5px)) translateY(-50%);
    }
    .loop-arrow.left {
        right: 100%;
        transform: translateX(calc(50% - .5px)) translateY(-50%);
    }
    .loop-arrow.right {
        left: 100%;
        transform: translateX(calc(-50% + .5px)) translateY(-50%);
    }

    .loop.incomplete {
        border-right: none;
        border-top: none;
        border-bottom: none;
        border-radius: 0;
    }
    .loop.incomplete .loop-name {
        left: 0;
        bottom: 0;
    }
    .loop.incomplete .loop-arrow {
        top: calc(50% - 1rem);
    }
</style>