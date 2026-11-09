<script>
    import ParamCtrl from "./ParamCtrl.svelte";
    import StartStopCtrl from "./StartStopCtrl.svelte";
    import { Notebook, NotebookPage } from "$lib/ui/notebook"
    import TranslatedCodeCtrl from "./TranslatedCodeCtrl.svelte";

    let {
        element=$bindable(),
        /** @prop @type {array<string>} List of param names not to show */
        hideParams=[],
        /** @prop @type {boolean} Set this to true for wider param notebooks (like in a Component dialog) */
        wide=false
    } = $props();

    let pageIndex = $state()

    // define order of categories (any not in here are 0)
    let categOrder = {
        // put these categories at the beginning
        Basic: -5, 
        Layout: -4, 
        Appearance: -3, 
        Formatting: -2, 
        Texture: -1,
        // put these categories at the end
        Data: 1,
        Custom: 2, 
        Hardware: 3, 
        Testing: 4
    }

    // params whose content can be translated 
    // (in the format { param name: JS param name })
    let translatableParams = {
        "Before Experiment": "Before JS Experiment", 
        "Begin Experiment": "Begin JS Experiment", 
        "Begin Routine": "Begin JS Routine", 
        "Each Frame": "Each JS Frame", 
        "End Routine": "End JS Routine", 
        "End Experiment": "End JS Experiment"
    }
    // keep track of which categories should be highlighted (for Code Component)
    let highlightCategs = $state({})
</script>

<div 
    class=container
    class:wide
>
    <!-- pre-notebook params -->
    {#if element.sortedParams.uncategorised}
        {#each Object.entries(element.sortedParams.uncategorised) as [name, param]}
            {#if ![...hideParams].includes(name)}
                <ParamCtrl 
                    name={name} 
                    param={param}
                />
            {/if}
        {/each}
    {/if}
    <!-- notebook -->
    {#if Object.keys(element.sortedParams).filter(value => value !== "uncategorised").length}
        <Notebook>
            {#each Object.entries(element.sortedParams).sort(
                (left, right) => (categOrder[left[0]] || 0) - (categOrder[right[0]] || 0)
            ) as [categ, params]}
                {#if !Object.keys(params).every(
                    (value) => hideParams.includes(value)
                ) && categ !== "uncategorised"}
                    <NotebookPage
                        label={categ}
                        highlight={highlightCategs[categ]}
                        data={element}
                        bind:selected={
                            () => {return pageIndex === categ},
                            (value) => {pageIndex = categ}
                        }
                    >
                        <div class=params-panel>
                            <!-- start ctrl, if needed -->
                            {#if "startVal" in params}
                                <StartStopCtrl
                                    bind:valueParam={element.params.startVal}
                                    bind:typeParam={element.params.startType}
                                    bind:expectedParam={element.params.startEstim}
                                />
                            {/if}
                            <!-- stop ctrl, if needed -->
                            {#if "stopVal" in params}
                                <StartStopCtrl
                                    bind:valueParam={element.params.stopVal}
                                    bind:typeParam={element.params.stopType}
                                    bind:expectedParam={element.params.durationEstim}
                                />
                            {/if}
                            <!-- other params -->
                            {#each Object.entries(params) as [name, param]}
                                {#if name in translatableParams}
                                    <!-- translatable code params need to be in a pane sizer -->
                                    <TranslatedCodeCtrl
                                        bind:codeTypeParam={element.params["Code Type"]}
                                        bind:pyParam={element.params[name]}
                                        bind:jsParam={element.params[translatableParams[name]]}
                                        bind:highlight={highlightCategs[categ]}
                                    />
                                {:else if [
                                    "startVal", 
                                    "startType", 
                                    "startEstim", 
                                    "stopVal", 
                                    "stopType", 
                                    "durationEstim", 
                                    ...Object.values(translatableParams), 
                                    ...hideParams
                                ].includes(name)}
                                    <!-- start/stop params and JS params are already covered, so skip them along with any always hidden -->
                                {:else}
                                    <!-- other params rendered as normal -->
                                    <ParamCtrl 
                                        name={name} 
                                        bind:param={element.params[name]}
                                    />
                                {/if}
                            {/each}
                        </div>
                    </NotebookPage>
                {/if}
            {/each}
        </Notebook>
    {/if}
</div>

<style>
    .container {
        display: flex;
        flex-direction: column;
        gap: .5rem;
        height: 100%;
        width: 100%;
        min-width: calc(min(50vw, 45rem));
        padding: 1rem;
        box-sizing: border-box;
        align-items: stretch;
    }
    .container.wide {
        min-width: calc(min(80vw, 65rem));
    }
    .params-panel {
        display: flex;
        flex-direction: column;
        flex-grow: 1;
        align-items: stretch;
        justify-content: stretch;
        gap: 1rem;
        box-sizing: border-box;
        padding: 1rem;
    }
</style>
