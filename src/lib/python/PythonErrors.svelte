<script>
    import { MessageArray, Message } from "$lib/ui/message";
    import { MessageDialog, DialogButton } from "$lib/ui/dialog";
    import { CodeOutput } from "$lib/ui/code";
    import { python } from "$lib/globals.svelte.js";
    import { translate } from "$lib/translation";

    let {
        enabled=$bindable()
    } = $props()

    let errors = $state([])

    // listener for messages
    let listener = (evt, message) => {
        if (enabled) {
            errors.push({
                showDlg: false,
                dismissed: false,
                message: message.error?.join?.("\n") || message
            })
        }
    }
    // listen to stderr from the app's own Python processes (not scripts/experiments)
    python.output.app.stderr.listen(listener)
    // listen for Liaison too
    python.liaison.listen("error", listener)
</script>


<MessageArray>
    {#each Object.keys(errors) as i}
        {#if !errors[i].dismissed}
            <Message
                message={translate("Python error, click to show")}
                icon="/icons/sym-error.svg"
                onclick={evt => errors[i].showDlg = true}
                ondismiss={evt => errors[i].dismissed = true}
            />
            <MessageDialog
                title={translate("Python error")}
                bind:shown={errors[i].showDlg}
            >
                <div class=output-container>
                    <CodeOutput value={errors[i].message} />
                </div>
                {#snippet buttons()}
                    <DialogButton
                        role=OK
                        onclick={evt => errors[i].dismissed = true}
                    />
                    <DialogButton role=CANCEL />
                {/snippet}
            </MessageDialog>
        {/if}
    {/each}
</MessageArray>

<style>
    .output-container {
        position: relative;
        height: 40rem;
        min-width: 55rem;
    }
</style>
