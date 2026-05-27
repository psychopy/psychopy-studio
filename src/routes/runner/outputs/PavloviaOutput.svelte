<script>
    import { CompactButton } from "$lib/utils/buttons";
    import { CodeOutput } from "$lib/utils/code";
    import { getContext } from "svelte";
    import { translate } from "$lib/translation";

    let current = getContext("current")

    
</script>


<CodeOutput bind:value={current.output.pavlovia}>
    {#snippet ctrls()}
        <CompactButton
            icon="/icons/btn-clear.svg"
            onclick={evt => current.output.pavlovia = ""}
            tooltip={translate("Clear pavlovia output")}
        />
    {/snippet}
</CodeOutput>