<script>
    import { Dialog } from "$lib/ui/dialog";
    import SearchProjects from "./SearchProjects.svelte";
    import { translate } from "$lib/translation"

    let {
        shown=$bindable(),
        awaiting=$bindable(),
        selection=$bindable(),
        params=$bindable()
    } = $props()

</script>

<Dialog
    title={translate("Search projects")}
    buttons={{
        OK: evt => {}
    }}
    bind:shown={shown}
    bind:awaiting={awaiting}
>
    <SearchProjects 
        bind:selection={selection}
        bind:params={params}
    />
</Dialog>
