<script>
    import { MessageDialog, DialogButton } from "$lib/ui/dialog";
    import { getContext } from "svelte";
    import callbacks from "../callbacks.svelte.js";
    import { translate } from "$lib/translation";

    let current = getContext("current")

    let {
        /** @prop @type {Function} Function to call after YES or NO is clicked (so after saving, if YES) */
        action=(evt) => {},
        /** @bindable @type {Boolean} State controlling whether this dialog is shown */
        shown=$bindable()
    } = $props()

    $effect(() => {
        if (shown && !current.experiment.history.past.length) {
            // if shown when there are no changes, skip and go straight to the action
            shown = false;
            action()
        }
    })
</script>

{#if current.experiment.history.past.length}
    <MessageDialog
        data-testid=save-prompt
        bind:shown={shown}
    >
        {translate("'{}' has unsaved changes, save now?").replace("{}", current.experiment.file.name)}
        {#snippet buttons()}
            <DialogButton
                action=YES
                onclick={(evt) => {
                    // if yes, save and do action
                    callbacks.save.fcn()
                    action(evt)
                }}
            />
            <DialogButton
                action=NO
                onclick={(evt) => {
                    // if no, just do action
                    action(evt)
                }}
            />
            <DialogButton action=CANCEL />
        {/snippet}
    </MessageDialog>
{/if}