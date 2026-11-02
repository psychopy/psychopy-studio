<script>
    import { Dialog } from "$lib/ui/dialog";
    import BrowseDemos from "./BrowseDemos.svelte";
    import { translate } from "$lib/translation"

    let {
        shown=$bindable(),
        awaiting=$bindable(),
        selection=$bindable(),
        params=$bindable()
    } = $props()

</script>

<Dialog
    title={translate("Browse demos")}
    bind:shown={shown}
    bind:awaiting={awaiting}
    buttons={["OK"]}
>
    <BrowseDemos 
        bind:selection={selection}
        bind:params={params}
    />
</Dialog>
