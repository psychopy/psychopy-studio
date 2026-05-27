<script>
    import EntryPoint from './EntryPoint.svelte'   
    import { Menu, MenuItem, SubMenu } from '$lib/utils/menu';
    import Tooltip from '$lib/utils/tooltip/Tooltip.svelte';
    import { getContext } from "svelte";
    import { copyRoutine } from "../callbacks.svelte";
    import ParamsDialog from "$lib/paramCtrls/ParamsDialog.svelte";
    import { translate } from "$lib/translation";
    
    let current = getContext("current");

    let {
        element=$bindable()
    } = $props()

    let show = $state({
        settingsDlg: false,
        contextMenu: false,
        tooltip: false
    })

    let contextMenuPos = $state({
        x: undefined,
        y: undefined
    });

    function removeRoutine(evt) {
        // update history
        current.experiment.history.update(`remove ${element.name}`);
        // remove this element from the flow
        current.experiment.flow.removeElement(element.index)
    }
    
    $effect(() => {
        if (!Object.values(current.experiment.routines).includes(element)) {
            current.experiment.flow.removeElement(element.index)
        }
    })

</script>

<EntryPoint index={element.index}></EntryPoint>
<button 
    class=routine 
    draggable={true}
    onmouseenter={() => {show.tooltip = true}}
    onmouseleave={() => {show.tooltip = false}}
    onfocusin={() => {show.tooltip = true}}
    onfocusout={() => {show.tooltip = false}}
    ondragstart={() => current.moving = element} 
    ondragend={() => current.moving = undefined} 
    onclick={() => current.routine = element}
    class:active={current.routine ? current.routine.name === element.name : false}
    class:disabled={element.disabled}
    oncontextmenu={(evt) => {
        evt.preventDefault();
        // show menu
        show.contextMenu = true;
        // set its position to the mouse pos
        contextMenuPos.x = evt.pageX;
        contextMenuPos.y = evt.pageY;
    }}
>
    <!-- tooltip -->
    {#if element.settings && "desc" in element.settings.params && element.settings.params['desc'].val}
        <Tooltip
            bind:shown={show.tooltip}
            position="bottom"
        >
            {#if element.settings.params['desc'].val.length > 64}
                {element.settings.params['desc'].val.slice(0, 64)}...
            {:else}
                {element.settings.params['desc'].val}
            {/if}
        </Tooltip>
    {/if}
    {element.name}
</button>

<!-- context menu -->
<Menu 
    bind:shown={show.contextMenu} 
    bind:position={contextMenuPos}
>
    {#if element.settings}
        <MenuItem
            icon="/icons/btn-edit.svg"
            label={translate("Routine settings")}
            onclick={evt => show.settingsDlg = true}
        />
    {/if}
    <MenuItem
        icon="/icons/sym-dot-{element.disabled ? "blue" : "light"}.svg"
        label={element.disabled ? translate("Enable Routine") : translate("Disable Routine")}
        onclick={(evt) => {
            // update history
            current.experiment.history.update(`${element.disabled ? "enable" : "disable"} ${element.name}`);
            // disable Routine
            if (element.settings) {
                element.settings.params.disabled.val = !element.disabled;
            } else {
                element.params.disabled.val = !element.disabled;
            }
        }}
    />
    <MenuItem 
        icon="/icons/btn-copy.svg"
        label={translate("Copy Routine")}
        onclick={evt => copyRoutine(element)}
    />
    <MenuItem 
        icon="/icons/btn-delete.svg"
        label={translate("Remove Routine")}
        onclick={removeRoutine}
    />
</Menu>

{#if element.settings}
    <ParamsDialog
        bind:element={element.settings}
        bind:shown={show.settingsDlg}
    />
{/if}

<style>
    .routine {
        position: relative;
        background-color: var(--blue);
        color: var(--text-on-blue);
        padding: 1rem;
        border-radius: 1rem;
        box-shadow: 
            inset -1px -1px 2px rgba(0, 0, 0, 0.05)
        ;
        border: 1px solid var(--blue);
        transform: translateY(-50%);
    }
    .routine:focus,
    .routine:hover {
        box-shadow: inset 1px 1px 10px rgba(0, 0, 0, 0.1);
        border-color: var(--outline);
    }
    .active {
        font-weight: bold;
    }
    .disabled {
        background-color: var(--overlay);
        border-color: var(--overlay);
    }
</style>