<script>
    import { MessageArray, Message } from "$lib/utils/message";
    import { MessageDialog } from "$lib/utils/dialog";
    import { CodeOutput } from "$lib/utils/code";
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
    // listen to Python stderr
    python.output.stderr.listen(listener)
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
            />
            <MessageDialog
                title={translate("Python error")}
                bind:shown={errors[i].showDlg}
                buttons={{
                    OK: evt => errors[i].dismissed = true,
                    CANCEL: evt => {}
                }}
            >
                <div class=output-container>
                    <CodeOutput value={errors[i].message} />
                </div>
            </MessageDialog>
        {/if}
    {/each}
</MessageArray>

<style>
    .output-container {
        position: relative;
        height: 40rem;
    }
</style>
