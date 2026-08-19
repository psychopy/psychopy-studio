<script>
    import { CompactButton } from "$lib/utils/buttons";
    import { CodeOutput } from "$lib/utils/code";
    import { translate } from "$lib/translation";
    import { python } from "$lib/globals.svelte";

    let stdout = $state([])

    // setup listeners for stdout
    python.output.stdout.listen(
        (evt, message) => stdout.push(`${message}\n`)
    )
    python.output.stderr.listen(
        (evt, message) => stdout.push(`${message}\n`)
    )

</script>


<CodeOutput value={stdout.join("")}>
    {#snippet ctrls()}
        <CompactButton
            icon="/icons/btn-clear.svg"
            onclick={evt => stdout = ""}
            tooltip={translate("Clear stdout")}
        />
    {/snippet}
</CodeOutput>