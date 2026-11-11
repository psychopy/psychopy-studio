<script>
    import { onMount } from "svelte";
    import { panels } from "$lib/globals.svelte";

    let {
        /** @prop @type {string} Text to display in this panel's sash */
        title,
        /** @prop {Snippet} children Child elements are rendered in the body of the panel */
        children=undefined,
        /** @prop {ComponentProperties} props Other props are passed to the panel's div */
        ...props
    } = $props()

    // state which keeps track of the index of each section
    let handle = $state.raw()

    onMount(() => {
        // add to focusable panels
        let entry = {
            handle: handle,
            // function to query whether the ribbon has focus
            hasFocus: () => handle?.contains?.(document.activeElement),
            // function to execute when the ribbon receives focus
            receiveFocus: () => {
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
        }
        panels.push(entry)
        // remove from focusable panels once unmounted
        return () => {
            panels.splice(panels.indexOf(entry), 1)
        }
    })
</script>

<div 
    {...props}
    class="panel" 
    bind:this={handle}
>
    <div class="pnl-title">
        {title}
    </div>
    <div class="pnl-content">
        {@render children?.()}
    </div>
</div>


<style>
    :root {
        --panel-padding: .5rem;
    }
    .panel {
        display: grid;
        position: relative;
        background-color: var(--mantle);
        border-radius: .25rem;
        overflow: hidden;
        grid-template: min-content 1fr / 1fr;
        /* margin: .15rem;
        width: calc(100% - .3rem);
        height: calc(100% - .3rem); */
        width: 100%;
        height: 100%;
    }
    .panel .pnl-content {
        position: relative;
        display: flex;
        flex-direction: column;
        height: stretch;
        width: stretch;
        overflow-y: auto;
        overflow-x: auto;
    }
    .panel .pnl-title {
        padding: .3em 1rem;
        background-color: var(--overlay);
        color: var(--text-on-overlay);
        width: stretch;
        overflow: hidden;
    }
</style>