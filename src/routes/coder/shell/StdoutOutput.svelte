<script>
    import { Button } from "$lib/ui/button";
    import { CodeOutput } from "$lib/ui/code";
    import { translate } from "$lib/translation";
    import { python } from "$lib/globals.svelte";
    import { onMount } from "svelte";

    let stdout = $state([])

    // setup listeners for stdout
    onMount(() => {
        let unlisteners = [
            python.output.stdout.listen(
                (evt, message) => stdout.push(`${message}\n`)
            ),
            python.output.stderr.listen(
                (evt, message) => stdout.push(`${message}\n`)
            )
        ]

        return () => unlisteners.forEach(unlisten => unlisten())
    })

</script>


<CodeOutput value={stdout.join("")}>
    {#snippet ctrls()}
        <Button
            icon="/icons/btn-clear.svg"
            onclick={evt => stdout = ""}
            tooltip={translate("Clear stdout")}
            small
        />
    {/snippet}
</CodeOutput>