<script>
    import Tooltip from "$lib/utils/tooltip/Tooltip.svelte";
    import { slide } from "svelte/transition";
    import { asset } from '$app/paths';

    let {
        /** @prop @type {string|import('svelte').Snippet} Label for this button */
        label,
        /** @prop @type {string|undefined} Hover text for this button, if any */
        tooltip=undefined,
        /** @bindable State controlling whether this panel button is open */
        open=$bindable(),
        /** @interface */
        children=undefined
    } = $props()
</script>

<button
    class=panel-button
    class:active={open}
    onclick={() => open = !open}
>
    {#if tooltip}
    <Tooltip>
        {tooltip}
    </Tooltip>
    {/if}
    {#if typeof label === "function"}
        {@render label()}
    {:else}
        {label}
    {/if}
    <svg 
        class=panel-indicator
        class:open={open}
    >
        <use href={asset("/icons/sym-arrow-right.svg")}></use>
    </svg>
</button>
{#if open}
<div 
    class="toggled-panel"
    transition:slide
>
    {@render children?.()}
</div>
{/if}

<style>
    button {
        position: relative;
        width: 100%;
        background: linear-gradient(transparent 0%, transparent 75%, rgba(0, 0, 0, 0.025) 100%);
        margin: .5rem 0;
        margin-bottom: .5rem;
        outline: none;
        border: none;
        padding: .5rem;
        border-bottom: 1px solid var(--overlay);
        transition: border-color .2s, background .2s;
        border-radius: 0;
        box-shadow: none;
    }
    button:enabled:focus,
    button:enabled:hover {
        border-color: var(--blue);
        background: linear-gradient(transparent 0%, transparent 75%, rgba(0, 0, 0, 0.05) 100%);
        box-shadow: none;
    }
    .panel-indicator {
        position: absolute;
        aspect-ratio: 1/1;
        left: 1rem;
        bottom: 1rem;
        height: .5rem;
        transition: transform .2s;
    }
    .panel-indicator.open {
        transform: rotate(90deg);
    }
</style>