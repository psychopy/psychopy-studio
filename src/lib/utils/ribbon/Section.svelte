<script>
    import { Icon } from "$lib/utils/icons";
    import { getContext, onMount } from "svelte";

    let {
        /** @prop @type {string} Label for this section */
        label="",
        /** @prop @type {string|undefined} Icon for this section, if any */
        icon=undefined,
        /** @interface */
        children=undefined
    } = $props()

    let ribbon = getContext("ribbon")
    
    // handle of this sections's HTML element
    let handle = $state.raw()
    // tracks when the Alt key is pressed (for visual indicators)
    let altKey = $state.raw(false)
    // shortcut of a ribbon section is its position in the ribbon (1-index)
    let index = $derived(
        Array.from(
            ribbon?.getElementsByClassName?.("ribbon-section") || []
        ).indexOf(handle)
    )
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
            {#if altKey}
                [<u>{index}</u>]
            {/if}
        </span>
    </div>
</div>

<svelte:window 
    onkeydown={evt => {
        // mark alt pressed
        if (evt.key === "Alt") {
            altKey = true
        }
        // focus first child
        if (altKey && evt.key === String(index)) {
            for (
                let child of Array.from(
                    handle.getElementsByTagName("*")
                )
                .filter(
                    child => child.tabIndex >= 0 && !child.disabled
                ).toSorted(
                    (a, b) => a.tabIndex - b.tabIndex
                )
            ) {
                child.focus()
                break
            }
        }
    }}
    onkeyup={evt => {
        // mark alt released
        if (evt.key === "Alt") {
            altKey = false
        }
    }}
/>

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
</style>