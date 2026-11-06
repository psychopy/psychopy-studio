<script>
    import { Dialog, DialogButton } from "$lib/ui/dialog";
    import { git } from "$lib/globals.svelte";
    import { getContext } from "svelte";
    import { translate } from "$lib/translation";

    let {
        shown=$bindable(),
        awaiting=$bindable(),
        changes=$bindable()
    } = $props()

    let current = getContext("current");

    let message = $state("")
</script>

<Dialog 
    title={translate("Commit changes")}
    onopen={evt => {
        message = "";
    }}
    bind:shown={shown}
    shrink
>
    <div class=content>
        {translate("Briefly describe the changes made since last sync.")}
        <input bind:value={message} />
        {translate("Changed files:")}
        <div class=changes>
            {#each changes as file}
                <span>{file}</span>
            {/each}
        </div>
    </div>
    {#snippet buttons()}
        <DialogButton
            role=OK
            onclick={async evt => {
                changes = await git.stage(
                    current.experiment.file.parent,
                    $state.snapshot(changes)
                )
                let resp = await git.commit(
                    $state.snapshot(message),
                    current.experiment.file.parent,
                    $state.snapshot(current.user)
                )
                // resolve promise
                awaiting.resolve(resp);
                // make new promise to await next time
                awaiting = Promise.withResolvers();  
            }}
        />
        <DialogButton
            role=CANCEL
            onclick={evt => {
                // resolve promise
                awaiting.reject(false);
                // make new promise to await next time
                awaiting = Promise.withResolvers();
            }}
        />
    {/snippet}
</Dialog>

<style>
    .content {
        display: flex;
        flex-direction: column;
        gap: .5rem;
        padding: 1rem;
        min-width: 35rem;
    }
    .changes {
        display: flex;
        flex-direction: column;
        gap: .2rem;
        background-color: var(--base);
        border: 1px solid var(--overlay);
        border-radius: .5rem;
        padding: .5rem 1rem;
        font-family: var(--mono);
    }
</style>