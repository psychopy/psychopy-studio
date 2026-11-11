<script>
    import { Dialog, DialogButton } from "$lib/ui/dialog";
    import { TreeRoot, TreeBranch, FileTreeNode } from "$lib/ui/tree";
    import { pathsToTree } from "$lib/utils/files";
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

{#snippet treeNode(tree)}
    {#if typeof tree === "string"}
        <FileTreeNode
            file={tree}
        />
    {:else}
        <TreeBranch
            label={tree.name}
            open
        >
            {#each tree.children as child}
                {@render treeNode(child)}
            {/each}
        </TreeBranch>
    {/if}
{/snippet}

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
        <TreeRoot>
            {#each pathsToTree(changes) as node}
                {@render treeNode(node)}
            {/each}
        </TreeRoot>
    </div>
    {#snippet buttons()}
        <DialogButton
            action=OK
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
            action=CANCEL
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
</style>