<script>
    import { CodeOutput } from "$lib/utils/code";
    import { MessageDialog } from "$lib/utils/dialog";
    import { python, electron } from "$lib/globals.svelte";
    import { translate } from "$lib/translation";
    import { untrack } from "svelte";

    let {
        tag,
        shown=$bindable()
    } = $props()
    let output = $state.raw("")
    electron.windows.listen(untrack(() => $state.snapshot(tag)), (evt, value) => output += value)
</script>

<MessageDialog
    bind:shown={shown}
    title={translate("Progress")}
    buttons={{
        OK: evt => output = ""
    }}
>
    <div class=output-container>
        <CodeOutput
            bind:value={output}
        />
    </div>
</MessageDialog>

<style>
    .output-container {
        overflow-y: auto;
        height: 20rem;
        min-width: 55rem;
        background-color: var(--base);
        border: 1px solid var(--overlay);
        border-radius: .5rem;
        padding: 1rem;
    }
</style>