<script>
    import { Icon } from "$lib/ui/icon";
    
    let {
        /** @prop @type {string} Label for this section */
        label="",
        /** @prop @type {string|undefined} Icon for this section, if any */
        icon=undefined,
        /** @interface */
        children=undefined
    } = $props()
    
    // handle of this sections's HTML element
    let handle = $state.raw()
</script>

<div
    class=ribbon-section
    bind:this={handle}
>
    {@render children?.()}
    <div
        class=ribbon-section-label
    >
        {#if icon}
            <Icon 
                src={icon}
            />
        {:else}
            <div></div>
        {/if}
        <span>
            {label}
        </span>
    </div>
</div>

<style>
    .ribbon-section {
        display: grid;
        position: relative;
        grid-auto-flow: column;
        grid-template-rows: [top] 1fr [divide] 1rem [bottom];
        justify-items: center;
        justify-content: center;
        align-items: stretch;
        gap: .5rem 0;
        padding: 0 1rem;
    }
    .ribbon-section>:global(*):not(.ribbon-section-label) {
        grid-row-start: top;
    }
    .ribbon-section-label {
        display: grid;
        grid-template-columns: [icon] 1rem [label] auto;
        gap: .5rem;
        align-items: center;
        position: absolute;
        bottom: 0;
    }
    .ribbon-section:not(:first-of-type) {
        border-left: 1px solid var(--overlay)
    }
    :global(.ribbon-section) + .ribbon-section {
        border-left: none;
    }
    .ribbon-section:not(:last-of-type) {
        border-right: 1px solid var(--overlay);
    }
</style>