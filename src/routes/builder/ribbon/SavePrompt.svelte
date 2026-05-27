<script>
    import { MessageDialog } from "$lib/utils/dialog";
    import { getContext } from "svelte";
    import { file_save } from "../callbacks.svelte.js";
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
        id=save-prompt
        bind:shown={shown}
        buttons={{
            YES: (evt) => {
                // if yes, save and do action
                file_save()
                action(evt)
            },
            NO: (evt) => {
                // if no, just do action
                action(evt)
            },
            CANCEL: (evt) => {},
        }}
    >
        {translate("'{}' has unsaved changes, save now?").replace("{}", current.experiment.file.name)}
    </MessageDialog>
{/if}