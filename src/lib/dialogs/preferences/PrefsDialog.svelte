<script>
    import { prefs } from "$lib/preferences.svelte";
    import ParamsDialog from "$lib/paramCtrls/ParamsDialog.svelte";
    import { translate } from "$lib/translation";

    let {
        shown=$bindable()
    } = $props()
</script>

{#await prefs.ready}
    {translate("Loading...")}
{:then}
    <ParamsDialog
        element={prefs}
        onapply={evt => prefs.save()}
        extraButtons={{
            Reset: evt => prefs.reset()
        }}
        bind:shown={shown}
    />
{/await}