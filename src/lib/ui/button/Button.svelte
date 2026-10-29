<script>
    import Icon from "$lib/ui/icon/Icon.svelte";
    import Tooltip from "$lib/ui/tooltip/Tooltip.svelte";
    import { MessageArray, Message } from "$lib/ui/message";
    import { MessageDialog } from "$lib/ui/dialog";
    import { translate } from "$lib/translation";

    let {
        /** @prop @type {string} Label for this button */
        label=undefined,
        /** @prop @type {string|undefined} Path to icon for this button, if any */
        icon=undefined,
        /** @prop @type {(evt: PointerEvent) => undefined} Function to call when this button is pressed */
        onclick,
        /** @prop @type {string|undefined} Hover text for this button, if any */
        tooltip=undefined,
        /** @prop @type {boolean} Shorthand for size="small" */
        small=false,
        /** @prop @type {boolean} Shorthand for size="large" */
        large=false,
        /** @prop @type {"small"|"regular"|"large"|undefined} Size of this button: "small" to shrink it down for compact layouts, "large" to expand it for effect */
        size=small ? "small" : large ? "large" : "regular",
        /** @prop @type {boolean} Shorthand for orientation="horizontal" */
        horizontal=false,
        /** @prop @type {boolean} Shorthand for orientation="vertical" */
        vertical=false,
        /** @prop @type {"h"|"horiz"|"horizontal"|"v"|"vert"|"vertical"} Set the layout of this button to horizontal or vertical */
        orientation=horizontal ? "horizontal" : vertical ? "vertical" : "horizontal",
        /** @prop @type {boolean} Is this button the primary action? */
        primary=false,
        /** @prop @type {boolean} Is this button an affirmative response? */
        affirmative=false,
        /** @prop @type {boolean} Is this button a negative response? */
        negative=false,
        /** @prop @type {boolean} Stretch button to fit its container? */
        stretch=false,
        /** @prop @type {boolean} Reduce padding around this button's contents? */
        tight=false,
        /** @prop @type {boolean} No background and only show border when hovered (looks better in the ribbon) */
        ghost=false,
        /** @prop @type {boolean} Style this button as though it's pressed in (mostly just for ToggleButton) */
        depressed=false,
        /** @prop @type {boolean} Are we awaiting execution of this button? */
        awaiting=$bindable(),
        /** @prop @type {function|undefined} If action is cancellable, supply a function to cancel it */
        cancel=undefined,
        /** @prop @type {boolean} Disable this button */
        disabled = false
    } = $props()

    let show = $state({
        tooltip: false,
        error: false
    })

    // name to use when referring to this button, falling back to tooltip if there is no label
    let name = $derived(label ?? tooltip)

    // resolve aliases for orientation to their full name
    let layout = $derived({
        h: "horizontal",
        horiz: "horizontal",
        horizontal: "horizontal",
        v: "vertical",
        vert: "vertical",
        vertical: "vertical"
    }[orientation])

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
        class:vertical={layout === "vertical"}
        class:horizontal={layout === "horizontal"}
        class:small={size === "small"}
        class:large={size === "large"}
        class:stretch
        class:tight
        class:ghost
        class:depressed
        class:primary
        class:affirmative
        class:negative
        onmouseenter={() => {if (tooltip) {show.tooltip = true}}}
        onmouseleave={() => {if (tooltip) {show.tooltip = false}}}
        onfocusin={() => {if (tooltip) {show.tooltip = true}}}
        onfocusout={() => {if (tooltip) {show.tooltip = false}}}
        aria-label={name}
    >
        {#if tooltip}
            <Tooltip
                bind:shown={show.tooltip}
                position=bottom
            >
                {{
                    // if completed/not started, regular label
                    ready: tooltip,
                    // if awaiting, regular label + cancel (if possible)
                    awaiting: name + (cancel ? ` (${translate("cancel")})` : ""),
                    // if error, error icon
                    error: translate("Failed, click to show error")
                }[status]}            
            </Tooltip>
        {/if}

        {#if icon}
            <div class=icon>
                <Icon 
                    src={{
                        // if completed/not started, regular icon
                        ready: icon,
                        // if awaiting, ... icon and cancel icon if hovered
                        awaiting: show.tooltip && cancel ? "/icons/sym-cancel.svg" : "/icons/sym-pending.svg",
                        // if error, error icon
                        error: "/icons/sym-error.svg"
                    }[status]}
                />
            </div>
        {/if}
        {#if label}
            <span
                class=label
            >
                {label}
            </span>
        {/if}
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
        title={translate("Error in '{}'").replace("{}", name)}
        buttons={{
            OK: evt => awaiting = Promise.resolve(false)
        }}
    >
        {err.message}
    </MessageDialog>

{/await}

<style>
    /* Core button styling */
    button {
        display: flex;
        position: relative;
        background-color: transparent;
        border: 1px solid var(--overlay);
        border-radius: .5rem;
        transition: border-color .2s, box-shadow .2s, background-color .2s, color .2s;
        box-shadow: 
            inset -1px -1px 2px rgba(0, 0, 0, 0.025)
        ;
        align-items: center;
        padding: .6em .8em;
        gap: .5em;
        font-family: var(--body);
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
    button .icon {
        flex-shrink: 0;
    }
    button .label {
        hyphens: auto;
    }

    /* Horizontal */
    button.horizontal {
        flex-direction: row;
        width: max-content;
    }
    button.horizontal .label {
        flex-shrink: 0;
    }

    /* Vertical */
    button.vertical {
        flex-direction: column;
    }
    button .icon {
        height: 2.25rem;
        aspect-ratio: 1 / 1;
    }

    /* Small */
    button.small {
        padding: .3rem .4rem;
    }
    button.small .icon {
        height: 1.25rem;
    }

    /* Large */
    button.large {
        padding: .9em 1.2em;
    }
    button.large .icon {
        height: 3.25rem;
    }

    /* Tight */
    button.tight {
        padding: .25rem;
    }

    /* Stretch */
    button.stretch {
        width: auto;
    }

    /* Ghost */
    button.ghost {
        box-shadow: none;
        border-color: transparent;
    }
    button.ghost:enabled:hover,
    button.ghost:enabled:focus {
        border-color: var(--overlay);
        box-shadow: 
            inset 1px 1px 10px rgba(0, 0, 0, 0.05)
        ;
    }
    button.ghost:enabled:focus {
        border-color: var(--blue);
    }

    /* Depressed */
    button.depressed {
        background-color: var(--crust);
        box-shadow:
            inset 1px 1px 5px rgba(0, 0, 0, 0.25)
        ;
    }
    button.depressed:enabled:hover,
    button.depressed:enabled:focus {
        background-color: var(--crust);
        box-shadow:
            inset 1px 1px 5px rgba(0, 0, 0, 0.15)
        ;
    }

    /* Primary */
    button.primary {
        color: var(--text-on-blue);
        background-color: var(--blue);
        border: 1px solid var(--blue);
    }

    /* Affirmative */
    button:enabled:hover.affirmative,
    button:enabled:focus.affirmative {
        color: var(--text-on-blue);
        background-color: var(--blue);
        border-color: var(--blue);
    }

    /* Negative */
    button:enabled:hover.negative,
    button:enabled:focus.negative {
        color: var(--text-on-red);
        background-color: var(--red);
        border-color: var(--red);
    }

    /* All colored buttons (primary, affirmative and negative) */
    button:enabled:hover.primary, button:enabled:focus.primary,
    button:enabled:hover.affirmative, button:enabled:focus.affirmative,
    button:enabled:hover.negative, button:enabled:focus.negative {
        border-color: var(--outline);
        box-shadow: 
            inset 1px 1px 10px rgba(0, 0, 0, 0.1)
        ;
    }
</style>
