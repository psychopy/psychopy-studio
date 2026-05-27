<script>
    import { Button } from "$lib/utils/buttons";
    import { Icon } from "$lib/utils/icons";
    import { MessageArray, Message } from "$lib/utils/message";
    import { MessageDialog } from "$lib/utils/dialog";
    import { CodeOutput } from "$lib/utils/code";
    import { marked } from "marked";
    import { status } from "./globals.svelte.js";
    import { setupPython } from "./functions.svelte.js";
    import { electron, python } from "$lib/globals.svelte";
    import { translate } from "$lib/translation";
    import ChooseDirectory from "./ChooseDirectory.svelte";
    import { prefs } from "$lib/preferences.svelte.js";
    
    // setup logging to app
    electron.windows.listen("uv", (evt, message) => status.logs += `${message}\n`)
    // setup on initial load
    $effect(() => {
        if (prefs.params.environmentsFolder.val) {
            // set directory when we have one
            python.uv.setDirectory(
                $state.snapshot(prefs.params.environmentsFolder.val)
            ).then(
                // setup Python once we have a folder
                evt => setupPython("app")
            )
        }
    })
</script>

{#await prefs.ready then ready}
    {#if !prefs.params.environmentsFolder.val}
        <ChooseDirectory />
    {/if}
{/await}

<MessageArray>
    {#await status.ready.promise}
        <Message
            message={status.message}
            onclick={evt => status.dlg.shown = true}
        />
    {:then didSetup}
        {#await status.dismiss.promise}
            <Message
                message={status.message}
                onclick={evt => status.dlg.shown = true}
                icon="/icons/sym-python.svg"
            />
        {/await}
    {:catch err}
        <div class=message>
            Failed setup: {err}
            <Button
                label={translate("Try again?")}
                icon="/icons/btn-refresh.svg"
                onclick={evt => setupPython()}
                horizontal
            />
        </div>
    {/await}
</MessageArray>

<MessageDialog
    bind:shown={status.dlg.shown}
    buttons={{
        OK: evt => {}
    }}
    buttonsDisabled={{
        OK: status.dlg.busy
    }}
>
    {@html marked(status.dlg.message || "")}
    <p>
        {translate("See below for details:")}
    </p>
    <div class=output-container>
        <CodeOutput bind:value={status.logs} />
    </div>
    {#await status.ready.promise then ready}
        <div class=finished-msg>
            {translate("Install completed successfully, you can safely close this window.")}
        </div>
    {:catch err}
        <div class=finished-msg style:color=var(--red)>
            <Icon 
                src="/icons/sym-error.svg"
                size=1rem
            />
            {translate("Install failed, see above for error.")}
        </div>
        
        <Button
            label="Try again?"
            icon="/icons/btn-refresh.svg"
            onclick={evt => setupPython()}
            horizontal
        />
    {/await}
</MessageDialog>

<style>
    .output-container {
        overflow-y: auto;
        height: 20rem;
        background-color: var(--base);
        border: 1px solid var(--overlay);
        border-radius: .5rem;
        padding: 1rem;
    }

    .finished-msg {
        padding: 1rem;
        display: flex;
        flex-direction: row;
        gap: .5rem;
    }
</style>
