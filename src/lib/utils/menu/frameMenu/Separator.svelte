<script>
import { electron } from "$lib/globals.svelte";
    import { getContext } from "svelte";
    import { MenuSeparator } from "..";

    // add separator to backend
    let template = getContext("template")
    template.push({
        type: "separator"
    })

</script>

{#if !electron}
    <MenuSeparator />
{/if}
