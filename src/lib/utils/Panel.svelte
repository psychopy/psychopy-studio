<script>
    let {
        /** @prop @type {string} Text to display in this panel's sash */
        title,
        /** @prop @type {string} Shortcut key to focus this panel (pressed with ALT) */
        shortcut=undefined,
        /** @interface */
        children=undefined
    } = $props()

    // handle of this panel's HTML element
    let handle = $state.raw()
    // tracks when the Alt key is pressed (for visual indicators)
    let altKey = $state.raw(false)
</script>

<div class="panel" bind:this={handle}>
    <div class="pnl-title">
        {#if shortcut && altKey && title.toLowerCase().includes(shortcut.toLowerCase())}
            {@const i = title.toLowerCase().indexOf(shortcut.toLowerCase())}
            {title.slice(0, i)}<u>{title[i]}</u>{title.slice(i+1)}
        {:else if shortcut && altKey}
            {title} [<u>{shortcut}</u>]
        {:else}
            {title}
        {/if}
    </div>
    <div class="pnl-content">
        {@render children?.()}
    </div>
</div>

<svelte:window 
    onkeydown={evt => {
        // mark alt pressed
        if (evt.key === "Alt") {
            altKey = true
        }
        // focus first child
        if (shortcut && altKey && evt.key === shortcut) {
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