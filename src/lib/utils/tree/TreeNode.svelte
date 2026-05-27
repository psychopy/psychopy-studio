<script>
    import { Icon } from "$lib/utils/icons";
    import { getContext } from "svelte";

    let {
        label,
        data=undefined,
        icon=undefined,
        onselect=(evt, data) => {},
        onactivate=(evt, data) => {},
        disabled=false,
        /** @interface */
        chevron
    } = $props()

    let handle = $state.raw();

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
    <!-- label -->
    <span class=node-label>
        {label}
    </span>
</button>

<style>
    .tree-node {
        display: flex;
        flex-direction: row;
        flex-wrap: nowrap;
        align-items: center;
        gap: .5rem;
        background-color: transparent;
        border: none;
        overflow: hidden;
        border-left: 1px solid transparent;
        padding: .5rem 1rem;
    }
    .tree-node:hover {
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