<script>
    import Icon from "$lib/utils/icons/Icon.svelte";
    import Tooltip from "$lib/utils/tooltip/Tooltip.svelte";
    import { Message, MessageArray } from "$lib/utils/message";
    import { MessageDialog } from "$lib/utils/dialog";
    import { translate } from "$lib/translation";

    let {
        /** @prop @type {string} Text label for this button, if any */
        label="",
        /** @prop @type {string} Icon for this button, if any */
        icon=undefined,
        /** @prop @type {function} Function to call when this button is clicked */
        onclick=(evt) => {},
        /** @prop @type {boolean} Disable this button */
        disabled=false,
        /** @prop @type {boolean} Only show border when hovered (looks better in the ribbon) */
        borderless=false,
        /** Are we awaiting execution of this button? */
        awaiting=$bindable(false),
        /** If action is cancellable, supply a function to cancel it */
        cancel=undefined,
        /** @interface */
        children=undefined,
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
        onmouseenter={() => {show.tooltip = true}}
        onmouseleave={() => {show.tooltip = false}}
        onfocusin={() => {show.tooltip = true}}
        onfocusout={() => {show.tooltip = false}}
        class:borderless={borderless}
        aria-label={label}
    >
        <Icon 
            src={{
                // if completed/not started, regular icon
                ready: icon,
                // if awaiting, ... icon and cancel icon if hovered
                awaiting: show.tooltip && cancel ? "/icons/sym-cancel.svg" : "/icons/sym-pending.svg",
                // if error, error icon
                error: "/icons/sym-error.svg"
            }[status]}
            size=2.25rem
        />
        <Tooltip
            bind:shown={show.tooltip}
            position="bottom"
        >
            {{
                // if completed/not started, regular label
                ready: label,
                // if awaiting, regular label + cancel (if possible)
                awaiting: label + (cancel ? ` (${translate("cancel")})` : ""),
                // if error, error icon
                error: translate("Failed, click to show error")
            }[status]}            
        </Tooltip>

        {@render children?.()}
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
            message="Error, click to show"
            icon="/icons/sym-error.svg"
            onclick={evt => show.error = true}
        />
    </MessageArray>
    <!-- error dialog -->
    <MessageDialog
        bind:shown={show.error}
        title="Error in '{label}'"
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
        padding: 0.25rem;
        margin: 0;
        grid-row-start: buttons;
        outline: none;
        
        border-radius: .5rem;
        transition: border-color .2s, box-shadow .2s;
        display: grid;
        grid-auto-flow: column;
        align-items: center;
        gap: .2rem;
        z-index: 1;


        border: 1px solid var(--overlay);
        transition: border-color .2s, box-shadow .2s, background-color .2s, color .2s;
        box-shadow: 
            inset -1px -1px 2px rgba(0, 0, 0, 0.025)
        ;
    }
    button.borderless {
        box-shadow: none;
        border-color: transparent;
    }
    button:disabled {
        opacity: .5;
    }

    button:enabled:hover,
    button:enabled:focus {
        outline: none;
        border-color: var(--blue);
        box-shadow: 
            inset 1px 1px 10px rgba(0, 0, 0, 0.05)
        ;
    }

    button.borderless:enabled:hover,
    button.borderless:enabled:focus {
        border-color: var(--overlay);
        box-shadow: 
            inset 1px 1px 10px rgba(0, 0, 0, 0.05)
        ;
    }
    button.borderless:enabled:focus {
        border-color: var(--blue);
    }

</style>
