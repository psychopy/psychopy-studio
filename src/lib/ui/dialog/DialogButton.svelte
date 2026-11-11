<script>
    import { Button } from "$lib/ui/button";
    import { getContext, untrack } from "svelte";
    import { translate } from "$lib/translation";

    let {
        /** @prop @type {"OK"|"APPLY"|"CANCEL"|"YES"|"NO"|"HELP"|string|undefined} Action of this button: one of the standard dialog actions (determining its position, default label, styling and whether it closes the dialog) and/or the name of a callback, as for `Button` */
        action=undefined,
        /** @prop @type {string|undefined} Label for this button, if not using the default for its action */
        label=undefined,
        /** @prop @type {Function|string|undefined} Function to call when this button is pressed (or, for HELP, a link to open) */
        onclick=undefined,
        /** @prop @type {object} Pass other props through to Button */
        ...props
    } = $props()

    // get dialog for context
    let dialog = getContext("dialog")

    // augment onclick according to action
    function handler(evt) {
        // handle when HELP button supplies onclick as a string
        if (action === "HELP" && typeof onclick === "string") {
            window.open(onclick, '_blank');
            return
        }
        try {
            onclick?.(evt);
        } finally {
            // close dialog if needed (even if onclick errored)
            if (["OK", "CANCEL", "YES", "NO"].includes(action)) {
                dialog.shown = false;
            }
        }
    }

    // store own snippet and handler in parent's context (re-registering if action changes)
    $effect(() => {
        let registeredAction = action;
        let entry = {
            snippet: button,
            onclick: handler,
            isDisabled: () => Boolean(props.disabled)
        }
        untrack(() => {
            if (registeredAction) {
                // if button has an action, store it against that action
                dialog.buttons[registeredAction] = entry
            } else {
                // otherwise, store it against OTHER
                dialog.buttons.OTHER.push(entry)
            }
        })
        // remove from parent's context when unmounted (compare by snippet, as entry gets proxied)
        return () => {
            if (registeredAction) {
                if (dialog.buttons[registeredAction]?.snippet === button) {
                    delete dialog.buttons[registeredAction]
                }
            } else {
                let i = dialog.buttons.OTHER.findIndex(other => other.snippet === button)
                if (i >= 0) {
                    dialog.buttons.OTHER.splice(i, 1)
                }
            }
        }
    })
</script>


{#snippet button()}
    <Button
        label={label ?? {
            OK: translate("OK"),
            APPLY: translate("Apply"),
            CANCEL: translate("Cancel"),
            YES: translate("Yes"),
            NO: translate("No"),
            HELP: translate("Help"),
        }[action]}
        action={action}
        onclick={handler}
        primary={action === "OK"}
        affirmative={action === "YES"}
        negative={action === "NO"}
        horizontal
        {...props}
    />
{/snippet}
