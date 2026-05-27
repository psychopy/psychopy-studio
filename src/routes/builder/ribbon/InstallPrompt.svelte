<script>
    import { MessageDialog } from "$lib/utils/dialog";
    import { getContext } from "svelte";
    import { python } from "$lib/globals.svelte";
    import { translate } from "$lib/translation";

    let current = getContext("current")

    let {
        /** @prop @type {Function} Function to call after YES or NO is clicked (so after installing, if YES) */
        action=(evt) => {},
        /** @bindable @type {Boolean} State controlling whether this dialog is shown */
        shown=$bindable()
    } = $props()
    
</script>


{#if shown}
    {#await python.uv.python({
        python: "3.10",
        psychopy: current.experiment.settings.params['Use version']?.val
    })}
        <MessageDialog
            id=install-prompt
            bind:shown={shown}
            buttons={{
                CANCEL: (evt) => {},
            }}
        >
            {translate("Installing PsychoPy {}...").replace("{}", current.experiment.settings.params['Use version']?.val)}
        </MessageDialog>
    {:then executable}
        {#await action(executable)}
            {""}
        {:then result}
            {console.log(result)}
        {:catch err}
            {console.error(err)}
        {/await}
    {:catch err}
        {console.error(err)}
    {/await}
{/if}