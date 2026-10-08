<script>
    import { Icon } from "$lib/utils/icons";
    import { Tooltip } from "$lib/utils/tooltip"
    import { getContext } from "svelte";

    let {
        label,
        tooltip=undefined,
        data=undefined,
        icon=undefined,
        onselect=(evt, data) => {},
        onactivate=(evt, data) => {},
        oncontextmenu=(evt, data) => {},
        disabled=false,
        /** @interface */
        chevron
    } = $props()

    let handle = $state.raw();
    let hovered = $state.raw(false);

    let siblings = getContext("siblings")
</script>

<button
    class=tree-node
    class:disabled={disabled}
    bind:this={handle}
    onclick={evt => {
        if (!disabled) {
            siblings.selected = handle;
            onselect(evt, data)
        }
    }}
    ondblclick={evt => {
        if (!disabled) {
            siblings.selected = handle;
            onselect(evt, data)
            onactivate(evt, data)
        }
    }}
    oncontextmenu={evt => oncontextmenu(evt, data)}
    onmouseenter={evt => hovered = true}
    onmouseleave={evt => hovered = false}
    onfocusin={evt => hovered = true}
    onfocusout={evt => hovered = false}
    class:selected={siblings.selected === handle}
    disabled={disabled}
>
    <!-- arrow showing open state -->
        {@render chevron?.()}
    <!-- optional icon -->
    {#if icon}
        <Icon 
            src={icon}
            size=1.25rem
        />
    {/if}
    <!-- optional tooltip -->
    {#if tooltip}
        <Tooltip 
            position="bottom-right"
            bind:shown={hovered}
        >
            {tooltip}
        </Tooltip>
    {/if}
    <!-- label -->
    <span class=node-label>
        {label}
    </span>
</button>

<style>
    .tree-node {
        position: relative;
        display: flex;
        flex-direction: row;
        flex-wrap: nowrap;
        align-items: center;
        gap: .5rem;
        background-color: transparent;
        border: none;
        border-left: 1px solid transparent;
        padding: .5rem 1rem;
    }
    .tree-node:hover,
    .tree-node:focus {
        background-color: var(--mantle);
    }
    .node-label {
        text-wrap: nowrap;
        text-overflow: ellipsis;
    }
    .selected {
        font-weight: bold;
    }
    .disabled {
        opacity: 50%;
    }
</style>