<script>
    import { Dialog } from "$lib/ui/dialog";
    import { Field } from "$lib/ui/input";
    import { RadioButton } from "$lib/ui/button";
    import { translate } from "$lib/translation";

    let {
        filter=$bindable(),
        shown=$bindable()
    } = $props();

    /**
     * Get the key for a filter: its items sorted and joined by commas, so filters with the same items always have the same key
     *
     * @param {string[]|undefined} value Filter to get the key for
     * @returns {string} Key for this filter ("" if there is no filter)
     */
    function keyFor(value) {
        return value?.toSorted().join(",") ?? ""
    }

    /**
     * Set the filter from a key made by `keyFor`
     *
     * @param {string} key Key to set the filter from
     */
    function setKey(key) {
        filter = key ? key.split(",") : undefined
    }

</script>

<Dialog
    id=component-filter
    title="Filter Components"
    bind:shown={shown}
    shrink
>
    <div class=container>
        <Field
            label={translate("Show only Components which work with...")}
        >
            <RadioButton 
                bind:selection={() => keyFor(filter), setKey}
                label={translate("Any")}
                value=""
                stretch
            />
            <RadioButton 
                bind:selection={() => keyFor(filter), setKey}
                label={translate("PsychoPy (local)")}
                value=PsychoPy
                stretch
            />
            <RadioButton 
                bind:selection={() => keyFor(filter), setKey}
                label={translate("PsychoJS (online)")}
                value=PsychoJS
                stretch
            />
            <RadioButton 
                bind:selection={() => keyFor(filter), setKey}
                label={translate("Both")}
                value=PsychoJS,PsychoPy
                stretch
            />
        </Field>
    </div>
</Dialog>

<style>
    .container {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding: 1rem;
    }
</style>
