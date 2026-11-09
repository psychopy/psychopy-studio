<script>
    import { Button } from "$lib/ui/button";
    import { getContext, untrack } from "svelte";
    import { translate } from "$lib/translation";

    let {
        /** @prop @type {"OK"|"APPLY"|"CANCEL"|"YES"|"NO"|"HELP"|undefined} Standard role of this button, determining its position, default label, styling and whether it closes the dialog */
        role=undefined,
        /** @prop @type {string|undefined} Label for this button, if not using the default for its role */
        label=undefined,
        /** @prop @type {Function|string|undefined} Function to call when this button is pressed (or, for HELP, a link to open) */
        onclick=undefined,
        /** @prop @type {object} Pass other props through to Button */
        ...props
    } = $props()

    // get dialog for context
    let dialog = getContext("dialog")

    // augment onclick according to role
    function handler(evt) {
        // handle when HELP button supplies onclick as a string
        if (role === "HELP" && typeof onclick === "string") {
            window.open(onclick, '_blank');
            return
        }
        try {
            onclick?.(evt);
        } finally {
            // close dialog if needed (even if onclick errored)
            if (["OK", "CANCEL", "YES", "NO"].includes(role)) {
                dialog.shown = false;
            }
        }
    }

    // store own snippet and handler in parent's context (re-registering if role changes)
    $effect(() => {
        let registeredRole = role;
        let entry = {
            snippet: button,
            onclick: handler,
            isDisabled: () => Boolean(props.disabled)
        }
        untrack(() => {
            if (registeredRole) {
                // if button has a role, store it against that role
                dialog.buttons[registeredRole] = entry
            } else {
                // otherwise, store it against OTHER
                dialog.buttons.OTHER.push(entry)
            }
        })
        // remove from parent's context when unmounted (compare by snippet, as entry gets proxied)
        return () => {
            if (registeredRole) {
                if (dialog.buttons[registeredRole]?.snippet === button) {
                    delete dialog.buttons[registeredRole]
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
        }[role]}
        data-role={role}
        onclick={handler}
        primary={role === "OK"}
        affirmative={role === "YES"}
        negative={role === "NO"}
        horizontal
        {...props}
    />
{/snippet}
