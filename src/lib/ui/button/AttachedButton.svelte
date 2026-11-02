<script>
    import { Icon } from "$lib/ui/icon";
    import { Tooltip } from "$lib/ui/tooltip";
    import { fly } from "svelte/transition";

    let {
        /** @prop @type {string} Path to icon for this button */
        icon,
        /** @prop @type {((evt: Event) => any)|undefined} Function to call when this button is pressed; if undefined, no button is shown */
        onclick=undefined,
        /** @prop @type {string|undefined} Hover text (and accessible label) for this button, if any */
        tooltip=undefined,
        /** @prop @type {string|undefined} Key (as in KeyboardEvent.key) which presses this button while focus is within the attached content; if given, the button itself is left out of the tab order */
        shortcut=undefined,
        /** @prop @type {boolean} Is this button a negative action (e.g. close/remove)? */
        negative=false,
        /** @prop @type {"top-right"|"right"} Where to position the button over the attached content: in the top right corner, or on the right and vertically centered */
        position="top-right",
        /** @interface @type {import("svelte").Snippet} Content to attach this button to */
        children
    } = $props()

    let hovered = $state({
        parent: false,
        button: false
    });
</script>

<!-- the button can't be nested in the content (which may itself be a button), so they sit side by side in a wrapper -->
<div
    class=attached-button-wrapper
    class:attached={onclick !== undefined}
    role=presentation
    onmouseenter={() => hovered.parent = true}
    onmouseleave={() => hovered.parent = false}
    onfocusin={() => hovered.parent = true}
    onfocusout={() => hovered.parent = false}
    onkeydown={evt => {
        if (onclick !== undefined && shortcut !== undefined && evt.key === shortcut) {
            // don't steal keys from text entry (e.g. Delete in an input)
            if (evt.target.closest("input, textarea, select, [contenteditable]")) {
                return
            }
            onclick(evt)
        }
    }}
>
    {@render children?.()}
    {#if onclick !== undefined && hovered.parent}
        <div 
            class=attached-button-ctrl
            class:top-right={position === "top-right"}
            class:right={position === "right"}
        >
            <button
                class=attached-button
                class:negative
                aria-label={tooltip}
                tabindex={shortcut !== undefined ? -1 : undefined}
                onclick={onclick}
                onmouseenter={() => hovered.button = true}
                onmouseleave={() => hovered.button = false}
                onfocusin={() => hovered.button = true}
                onfocusout={() => hovered.button = false}
                transition:fly={{ 
                    x: ".5rem",
                    delay: 0.5, 
                    duration: 250
                }}
            >
                <Icon
                    src={icon}
                    size=.75rem
                />
            </button>
            <!-- tooltip is a sibling of the button, so clicking it doesn't press the button -->
            {#if tooltip}
                <Tooltip
                    bind:shown={hovered.button}
                    position="bottom"
                >
                    {tooltip}
                </Tooltip>
            {/if}
        </div>
    {/if}
</div>

<style>
    .attached-button-wrapper {
        position: relative;
        display: grid;
    }
    .attached-button-ctrl {
        position: absolute;
        display: flex;
        align-items: center;
        /* stay above attached content, even if it's raised (e.g. a current tab) */
        z-index: 3;
    }
    .attached-button {
        display: flex;
        margin: 0;
        padding: .5rem;
        border: none;
        border-radius: .5rem;
        background-color: var(--outline);
        color: var(--text-on-outline);
        opacity: .5;
        transition: opacity .2s, background-color .2s, color .2s;
    }
    /* hover effect */
    .attached-button:hover,
    .attached-button:focus {
        outline: none;
        opacity: 1;
        background-color: var(--blue);
        color: var(--text-on-blue);
    }
    .attached-button.negative:hover,
    .attached-button.negative:focus {
        background-color: var(--red);
        color: var(--text-on-red);
    }
    /* positioning */
    .attached-button-ctrl.top-right {
        top: .5rem;
        right: .5rem;
    }
    .attached-button-ctrl.right {
        top: 0;
        bottom: 0;
        right: .25rem;
    }
</style>
