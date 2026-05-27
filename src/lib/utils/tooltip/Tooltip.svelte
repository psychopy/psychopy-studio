<script>
    import { slide } from 'svelte/transition';
    
    let {
        /** State to use to show/hide the tooltip */
        shown=$bindable(false),
        /** @prop @type {number} Delay before showing this tooltip */
        delay = 0.5,
        /** @prop @type {number} Width (px) at which to start wrapping text */
        maxWidth = 400,
        /** @prop @type {string} Where to show the tooltip, relative to its parent */
        position = "right",
        /** @interface */
        children
    } = $props()

    let width = $state.raw();
</script>

{#if shown}
    <div 
        class=tooltip
        transition:slide={{axis: "x", delay: delay}}
        style:inset={{
            "top": "auto auto calc(100% + .5rem) 0",
            "top-right": "auto 0 calc(100% + .5rem) auto",
            "bottom": "calc(100% + .5rem) auto auto 0",
            "bottom-right": "calc(100% + .5rem) 0 auto auto",
            "left": "auto calc(100% + .5rem) auto auto",
            "right": "auto auto auto calc(100% + .5rem)",
        }[position]}
        style:max-width="{maxWidth}px"
    >
        <div 
            class=tooltip-content
            bind:clientWidth={width}
            style:text-wrap={width >= maxWidth ? "wrap" : "nowrap"}
            style:width={width >= maxWidth ? `${maxWidth}px` : "auto"}
        >
            {@render children?.()}
        </div>
    </div>
{/if}

<style>
    .tooltip {
        position: absolute;
        padding: .25rem .5rem;
        border-radius: .5rem;
        background-color: var(--outline);
        color: var(--text-on-outline);
        overflow: hidden;
        max-width: 35rem;
    }
</style>