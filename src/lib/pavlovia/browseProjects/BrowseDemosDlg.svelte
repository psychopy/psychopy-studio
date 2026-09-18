<script>
    import { Dialog } from "$lib/utils/dialog";
    import { Notebook, NotebookPage } from "$lib/utils/notebook";
    import BrowseDemos from "./BrowseDemos.svelte";
    import { translate } from "$lib/translation"

    let {
        shown=$bindable(),
        awaiting=$bindable()
    } = $props()

</script>

<Dialog
    title={translate("Browse demos")}
    buttons={{
        OK: evt => {}
    }}
    bind:shown={shown}
    bind:awaiting={awaiting}
>
    <BrowseDemos />
</Dialog>
