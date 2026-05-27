<script>
    import { Dialog } from "$lib/utils/dialog";
    import { translate } from "$lib/translation";

    let {
        filter=$bindable(),
        shown=$bindable()
    } = $props();

</script>

<Dialog
    id=component-filter
    title="Filter Components"
    bind:shown={shown}
    shrink
>
    <div class=container>
        {translate("Show only Components which work with...")}
        <div class=radio-ctrl>  
            <input 
                type=radio 
                id=component-filter-any 
                name=component-filter
                onclick={(evt) => filter = undefined}
                checked={filter === undefined}
            />
            <label for=component-filter-any>Any</label>

            <input 
                type=radio 
                id=component-filter-py 
                name=component-filter
                onclick={(evt) => filter = ["PsychoPy"]}
                checked={filter && filter.includes("PsychoPy") && !filter.includes("PsychoJS")}
            />
            <label for=component-filter-py>
                {translate("PsychoPy (local)")}
            </label>
                
            <input 
                type=radio 
                id=component-filter-js 
                name=component-filter
                onclick={(evt) => filter = ["PsychoJS"]}
                checked={filter && !filter.includes("PsychoPy") && filter.includes("PsychoJS")}
            />
            <label for=component-filter-js>
                P{translate("PsychoJS (online)")}
            </label>

            <input 
                type=radio 
                id=component-filter-both 
                name=component-filter
                onclick={(evt) => filter = ["PsychoPy", "PsychoJS"]}
                checked={filter && filter.includes("PsychoPy") && filter.includes("PsychoJS")}
            />
            <label for=component-filter-both>
                {translate("Both")}
            </label>
        </div>
    </div>
</Dialog>

<style>
    .container {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding: 1rem;
    }
    .radio-ctrl {
        display: grid;
        grid-template-columns: min-content auto;
        gap: .5rem;
        align-items: center;
    }
</style>
