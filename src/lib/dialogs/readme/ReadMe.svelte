<script>
    import { marked } from "marked";
    import { Dialog, DialogButton } from "$lib/ui/dialog";
    import { openIn } from "$lib/utils/views.svelte";
    import { translate } from "$lib/translation";

    let {
        script,
        shown=$bindable()
    } = $props()
</script>


<Dialog
    title={script.file.name}
    bind:shown={shown}
    shrink
>
    <div class=readme-preview>
        {@html marked(script.content || "")}
    </div>
    {#snippet buttons()}
        <DialogButton role=OK />
        <DialogButton
            label={translate("Edit")}
            onclick={evt => openIn(script.file, "coder")}
            disabled={!script.file?.parent}
        />
        <DialogButton
            label={translate("Refresh")}
            onclick={evt => script.fromFile(script.file)}
            disabled={!script.file?.parent}
        />
    {/snippet}
</Dialog>

<style>
    .readme-preview {
        width: 100%;
        min-width: 55rem;
        min-height: 100%;
        box-sizing: border-box;
        padding: 1rem 2rem;
        background-color: var(--base);
    }
</style>