<script>
    import { getContext, onMount } from "svelte";
    import Tooltip from "../tooltip/Tooltip.svelte";

    let {
        callback,
        tooltip=undefined,
        label="+",
        disabled=false
    } = $props()

    let hovered = $state.raw(false)

    let siblings = getContext("siblings")
    // tell parent that this button exists
    siblings.buttons += 1
</script>


<button
    class=add-btn
    class:listbook={siblings.book === "listbook"}
    class:notebook={siblings.book === "notebook"}
    onclick={callback}
    onmouseenter={() => {hovered = true}}
    onmouseleave={() => {hovered = false}}
    onfocusin={() => {hovered = true}}
    onfocusout={() => {hovered = false}}
    disabled={disabled}
>
    {label}
    {#if tooltip}
        <Tooltip
            bind:shown={hovered}
            position={siblings.book === "listbook" ? "right" : "bottom"}
        >
            {tooltip}
        </Tooltip>
    {/if}
</button>

<style>
    button {
        position: relative;
        color: var(--outline);
        transition: background .2s, color .2s;
        background-color: var(--crust);
        z-index: 2;
        border-radius: 0;
    }
    button:enabled:hover,
    button:enabled:focus {
        color: var(--blue);
        background-color: var(--base);
    }
    button:disabled {
        opacity: 50%;
    }

    button.notebook {
        grid-row-start: tabs;
        border-left: 1px solid var(--overlay);
        line-height: 1em;
        padding: .75rem;
    }

    button.listbook {
        grid-column-start: tabs;
        border-top: 1px solid var(--overlay);
        padding: 1rem;
    }
</style>