<script>
    import { fly } from "svelte/transition";

    let {
        /** State to use to show/hide the tooltip */
        shown=$bindable(false),
        /** @prop @type {number} Delay (s) before showing this tooltip */
        delay = 0.1,
        /** @prop @type {number} Width (px) at which to start wrapping text */
        maxWidth = 400,
        /** @prop @type {string} Where to show the tooltip, relative to its parent */
        position = "right",
        /** @prop @type {number} Time (s) to wait after mouseout before hiding, so the mouse can move onto the tooltip */
        grace = 0.05,
        /** @interface */
        children
    } = $props()

    // unique anchor name linking the tooltip to its parent
    let uid = $props.id()
    let anchor = `--tooltip-${uid}`

    // where to place the tooltip relative to its anchor, which side to leave a gap on, and which way to fly in from
    let placements = {
        "top": { area: "top span-right", margin: "0 0 .5rem 0", fly: { y: ".5rem" } },
        "top-right": { area: "top span-left", margin: "0 0 .5rem 0", fly: { y: ".5rem" } },
        "bottom": { area: "bottom span-right", margin: ".5rem 0 0 0", fly: { y: "-.5rem" } },
        "bottom-right": { area: "bottom span-left", margin: ".5rem 0 0 0", fly: { y: "-.5rem" } },
        "left": { area: "left span-bottom", margin: "0 .5rem 0 0", fly: { x: ".5rem" } },
        "right": { area: "right span-bottom", margin: "0 0 0 .5rem", fly: { x: "-.5rem" } },
    }

    // is the mouse over the tooltip itself?
    let held = $state.raw(false);
    // should the popover be open?
    let visible = $state.raw(false);

    $effect(() => {
        // show right away
        if (shown || held) {
            visible = true
            return
        }
        // wait before hiding, to give the mouse time to cross the gap onto the tooltip
        let timeout = setTimeout(() => visible = false, grace * 1000)
        // cancel the hide if shown/held changes before it fires
        return () => clearTimeout(timeout)
    })

    /**
     * Open the popover when the tooltip is added and anchor it to its parent element
     */
    function popover(node) {
        // keep hold of the parent, as the node is detached by the time we unanchor
        let parent = node.parentElement
        // anchor
        parent?.style.setProperty("anchor-name", anchor)
        // open
        node.showPopover()
        // unanchor it when done
        return () => parent?.style.removeProperty("anchor-name")
    }

    let width = $state.raw();
</script>

{#if visible}
    <div
        class=tooltip
        popover=hint
        {@attach popover}
        style:position-anchor={anchor}
        style:position-area={placements[position].area}
        style:margin={placements[position].margin}
        style:max-width="{maxWidth}px"
        transition:fly={{
            ...placements[position].fly, 
            delay: delay * 1000, 
            duration: 200
        }}
        onmouseenter={evt => held = true}
        onmouseleave={evt => held = false}
        ontoggle={evt => {
            // if the popover closed itself (e.g. Escape or light dismiss), dismiss immediately
            if (evt.newState === "closed") {
                shown = false
                held = false
                visible = false
            }
        }}
        role=none
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
        inset: auto;
        border: none;
        padding: .25rem .5rem;
        border-radius: .5rem;
        background-color: var(--outline);
        color: var(--text-on-outline);
        overflow: hidden;
        max-width: 35rem;
        position-try-fallbacks: flip-block, flip-inline;
        /* popovers still inherit from their DOM parent, so reset text styling */
        line-height: normal;
        font-weight: normal;
        font-style: normal;
        text-align: left;
    }
</style>
