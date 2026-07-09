<script>
    import { LoopInitiator, LoopTerminator, Routine, StandaloneRoutine } from '$lib/experiment';
    import { pasteRoutine } from "../callbacks.svelte";
    import { Menu, MenuItem } from '$lib/utils/menu';
    import { getContext } from "svelte";
    import { translate } from "$lib/translation";
    
    let current = getContext("current");
    
    let {
        index=undefined
    } = $props()

    let hovered = $state(false);
    
    let contextMenu = $state({
        shown: false,
        pos: {
            x: undefined,
            y: undefined
        }
    });

    let moving = $derived(
        current.moving && [
            Routine, 
            StandaloneRoutine, 
            LoopInitiator, 
            LoopTerminator
        ].includes(current.moving.constructor)
    )
    
    let inserting = $derived(
        current.inserting && [
            Routine, 
            StandaloneRoutine, 
            LoopInitiator, 
            LoopTerminator
        ].includes(current.inserting.constructor)
    )

    function insertHere(evt) {
        // if dragging, move dragged element here
        if (current.moving) {
            // update history
            current.experiment.history.update(`move ${current.moving.name} in flow`);
            // relocate it
            current.experiment.flow.relocateElement(current.moving, index)
            // done dragging
            current.moving = undefined
        }
        // if inserting, insert element here
        if (current.inserting) {
            // update history
            current.experiment.history.update(`insert ${current.inserting.name} into flow`);
            // insert
            current.experiment.flow.insertElement(current.inserting, index);
            // next steps depend on type of element inserted
            if (current.inserting instanceof LoopInitiator) {
                // ready to insert terminator
                current.inserting.addTerminator();
                current.inserting = current.inserting.terminator;
            } else {
                // done inserting
                current.inserting = undefined;
            }
        }
        // make sure no loops are broken
        for (let i in current.experiment.flow.flat) {
            let node = current.experiment.flow.flat[i]
            // only interested in loop terminators
            if (!(node instanceof LoopTerminator)) {
                continue
            }
            // only interested if terminator is in front of initiator
            if (node.index < node.initiator.index) {
                // relocate this terminator to where the initiator is
                current.experiment.flow.relocateElement(
                    node,
                    $state.snapshot(node.initiator.index)
                )
                // relocate the initiator to here
                current.experiment.flow.relocateElement(
                    node.initiator,
                    i
                )
            }
        }
    }
</script>

<div 
    class="entry-point" 
    class:active={moving || inserting} 
    class:hovered={hovered}
>
    <button 
        class="hitbox" 
        ondragenter={(evt) => hovered = true} 
        ondragover={(evt) => evt.preventDefault()} 
        ondragleave={(evt) => hovered = false} 
        onmouseenter={(evt) => {hovered = true}} 
        onmouseleave={(evt) => {hovered = false}} 
        onfocusin={(evt) => {hovered = true}}
        onfocusout={(evt) => {hovered = false}} 
        ondrop={insertHere} 
        onclick={insertHere}
        aria-label="Entry point"
        tabindex={moving || inserting ? 0 : -1}
        oncontextmenu={(evt) => {
            evt.preventDefault();
            // show menu
            contextMenu.shown = true;
            // set its position to the mouse pos
            contextMenu.pos.x = evt.pageX;
            contextMenu.pos.y = evt.pageY;
        }}
    >
    </button>
</div>

<!-- context menu -->
<Menu 
    bind:shown={contextMenu.shown} 
    bind:position={contextMenu.pos}
>
    <MenuItem 
        icon="/icons/btn-paste.svg"
        label={translate("Paste Routine")}
        onclick={evt => {
            pasteRoutine().then(
                routine => {
                    current.inserting = routine
                    insertHere()
                }
            )
        }}
    />
</Menu>

<style>
    .entry-point {
        opacity: 0;
        border-radius: 100%;
        height: .75rem;
        width: .75rem;
        padding: 0;
        margin: 0;
        position: relative;
        transform: translateY(-50%);
        background-color: var(--outline);
    }
    .entry-point.active {
        opacity: 1;
    }
    .entry-point.active.hovered {
        opacity: 1;
        background-color: var(--red);
    }

    .entry-point .hitbox {
        position: absolute;
        left: -1rem; right: -1rem; top: -1rem; bottom: -1rem;
        color: transparent !important;
        background-color: transparent !important;
        border: none !important;
        box-shadow: none !important;
    }
</style>