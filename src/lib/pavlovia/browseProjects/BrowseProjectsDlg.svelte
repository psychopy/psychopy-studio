<script>
    import { Dialog } from "$lib/utils/dialog";
    import { Notebook, NotebookPage } from "$lib/utils/notebook";
    import BrowseDemos from "./BrowseDemos.svelte";

    let {
        shown=$bindable(),
        awaiting=$bindable()
    } = $props()

</script>

<Dialog
    bind:shown={shown}
    bind:awaiting={awaiting}
>
    <Notebook>
        <NotebookPage
            label="Demos"
        >
            <BrowseDemos />
        </NotebookPage>
    </Notebook>
</Dialog>
