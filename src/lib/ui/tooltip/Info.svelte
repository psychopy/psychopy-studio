<script>
    import { fly } from "svelte/transition";
    import { Icon } from "$lib/ui/icon";
    
    let {
        /** @interface */
        children
    } = $props()

    let hovered = $state.raw(false)

    // unique anchor name linking the popover to the info icon
    const uid = $props.id()
    let anchor = `--info-${uid}`

    /**
     * Open the popover as soon as it's added
     */
    function popover(node) {
        node.showPopover()
    }

</script>

<div
    class=info
    style:anchor-name={anchor}
    style:opacity={hovered ? 1 : 0.25}
    onmouseenter={() => hovered = true}
    onmouseleave={() => hovered = false}
    onfocusin={() => hovered = true}
    onfocusout={() => hovered = false}
    role=none
>
    <div class=i-container>
        <Icon 
            src="/icons/sym-info.svg"
            size=0.8rem
        />
    </div>

    {#if hovered}
        <div
            class=info-popover
            popover=hint
            {@attach popover}
            style:position-anchor={anchor}
            transition:fly={{ x: "-.5rem", duration: 200 }}
            ontoggle={evt => {
                // if the popover closed itself (e.g. Escape or light dismiss), dismiss immediately
                if (evt.newState === "closed") {
                    hovered = false
                }
            }}
        >
            {@render children?.()}
        </div>
    {/if}
</div>


<style>
    .info {
        position: relative;
        height: 1.5rem;
        width: 1.5rem;
        box-sizing: border-box;
        background-color: var(--outline);
        color: var(--base);
        border-radius: 50%;
    }
    .i-container {
        position: absolute;
        inset: .25rem;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .info-popover {
        inset: auto;
        position-area: right span-bottom;
        position-try-fallbacks: flip-block, flip-inline;
        margin: 0 0 0 .5rem;
        max-width: 35rem;
        border: none;
        padding: .25rem .5rem;
        border-radius: .5rem;
        background-color: var(--outline);
        color: var(--text-on-outline);
        overflow: hidden;
        /* popovers still inherit from their DOM parent, so reset text styling */
        line-height: normal;
        font-weight: normal;
        font-style: normal;
        text-align: left;
    }
</style>