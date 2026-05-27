<script>
    import Icon from "$lib/utils/icons/Icon.svelte";
    import Tooltip from "$lib/utils/tooltip/Tooltip.svelte";
    import { MessageArray, Message } from "$lib/utils/message";
    import { MessageDialog } from "$lib/utils/dialog";
    import { translate } from "$lib/translation";

    let {
        /** @prop @type {string} Label for this button */
        label,
        /** @prop @type {string|undefined} Path to icon for this button, if any */
        icon = undefined,
        /** @prop @type {(evt: PointerEvent) => undefined} Function to call when this button is pressed */
        onclick,
        /** @prop @type {string|undefined} Hover text for this button, if any */
        tooltip = undefined,
        /** @prop @type {boolean} Is this button the primary action? */
        primary = false,
        /** @prop @type {boolean} Is this button an affirmative response? */
        affirmative = false,
        /** @prop @type {boolean} Is this button a negative response? */
        negative = false,
        /** @prop @type {boolean} Set the layout of this button to horizontal */
        horizontal = false,
        /** @prop @type {boolean} Set the layout of this button to vertical */
        vertical = false,
        /** @prop @type {boolean} Are we awaiting execution of this button? */
        awaiting=$bindable(),
        /** If action is cancellable, supply a function to cancel it */
        cancel=undefined,
        /** @prop @type {boolean} Disable this button */
        disabled = false
    } = $props()

    let show = $state({
        tooltip: false,
        error: false
    })

</script>

{#snippet button(status)}
    <button
        disabled={disabled} 
        onclick={{
            // if completed/not started, execute method
            ready: evt => awaiting = onclick(evt),
            // if awaiting, execute cancel method
            awaiting: evt => cancel?.(evt),
            // if errored, show error
            error: evt => show.error = true
        }[status]}
        class:vertical
        class:horizontal
        class:primary
        class:affirmative
        class:negative
        onmouseenter={() => {if (tooltip) {show.tooltip = true}}}
        onmouseleave={() => {if (tooltip) {show.tooltip = false}}}
        onfocusin={() => {if (tooltip) {show.tooltip = true}}}
        onfocusout={() => {if (tooltip) {show.tooltip = false}}}
    >
        {#if tooltip}
            <Tooltip
                bind:shown={show.tooltip}
                position={vertical ? "bottom" : "right"}
            >
                {{
                    // if completed/not started, regular label
                    ready: tooltip,
                    // if awaiting, regular label + cancel (if possible)
                    awaiting: label + (cancel ? ` (${translate("cancel")})` : ""),
                    // if error, error icon
                    error: translate("Failed, click to show error")
                }[status]}            
            </Tooltip>
        {/if}

        {#if icon}
            <div class=icon-container>
                <Icon 
                    src={{
                        // if completed/not started, regular icon
                        ready: icon,
                        // if awaiting, ... icon and cancel icon if hovered
                        awaiting: show.tooltip && cancel ? "/icons/sym-cancel.svg" : "/icons/sym-pending.svg",
                        // if error, error icon
                        error: "/icons/sym-error.svg"
                    }[status]}
                    size={vertical ? "2.75rem" : "2.25rem"}
                />
            </div>
        {/if}
        <span
            class=label
        >{label}</span>
    </button>
{/snippet}

{#await awaiting}
    {@render button("awaiting")}
{:then}
    {@render button("ready")}
{:catch err}
    {@render button("error")}
    <!-- error message -->
    <MessageArray>
        <Message
            message={translate("Error, click to show")}
            icon="/icons/sym-error.svg"
            onclick={evt => show.error = true}
        />
    </MessageArray>
    <!-- error dialog -->
    <MessageDialog
        bind:shown={show.error}
        title={translate("Error in '{}'").replace("{}", label)}
        buttons={{
            OK: evt => awaiting = Promise.resolve(false)
        }}
    >
        {err.message}
    </MessageDialog>

{/await}

<style>
    button {
        position: relative;
        background-color: transparent;
        border: 1px solid var(--overlay);
        border-radius: .5rem;
        transition: border-color .2s, box-shadow .2s, background-color .2s, color .2s;
        box-shadow: 
            inset -1px -1px 2px rgba(0, 0, 0, 0.025)
        ;
    }

    button:disabled {
        opacity: 50%;
    }
    button:enabled:hover,
    button:enabled:focus {
        outline: none;
        border-color: var(--blue);
        box-shadow: 
            inset 1px 1px 10px rgba(0, 0, 0, 0.05)
        ;
    }

    button.primary {
        color: var(--text-on-blue);
        background-color: var(--blue);
        border-width: 0;
    }
    button:enabled:hover.primary, button:enabled:focus.primary,
    button:enabled:hover.affirmative, button:enabled:focus.affirmative,
    button:enabled:hover.negative, button:enabled:focus.negative {
        box-shadow: 
            inset 1px 1px 10px rgba(0, 0, 0, 0.1)
        ;
    }

    button:enabled:hover.affirmative,
    button:enabled:focus.affirmative {
        color: var(--text-on-blue);
        background-color: var(--blue);
        border-color: var(--blue);
    }

    button:enabled:hover.negative,
    button:enabled:focus.negative {
        color: var(--text-on-red);
        background-color: var(--red);
        border-color: var(--red);
    }

    button:disabled {
        opacity: 50%;
    }
    button:enabled:hover,
    button:enabled:focus {
        outline: none;
        border-color: var(--blue);
        box-shadow: 
            inset 1px 1px 10px rgba(0, 0, 0, 0.05)
        ;
    }    
    
    button {
        display: grid;
        align-items: center;
        padding: .6em .8em;
        gap: .1rem;
        font-family: var(--body);
        max-width: 100%;
        max-height: 100%;
    }
    button .icon-container {
        height: 2.25rem;
        aspect-ratio: 1 / 1;
    }

    button.horizontal {
        grid-template-columns: [icon] min-content [label] max-content;
        justify-content: start;
    }
    button.horizontal .icon-container {
        width: 2rem;
        margin-right: .5rem;
        grid-column-start: icon;
    }
    button.horizontal .label {
        grid-column-start: label;
    }

    button.vertical {
        grid-template-rows: [icon] min-content [label] min-content;
        justify-items: center;
    }
    button.vertical .icon-container {
        height: 3rem;
        margin-bottom: .5rem;
        grid-row-start: icon;
    }
    button.vertical .label {
        grid-row-start: label;
        hyphens: auto;
    }
</style>
