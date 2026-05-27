<script>
    import { ToggleButton } from "$lib/utils/buttons";
    import { Dialog } from "$lib/utils/dialog"
    import { ParamsDialog } from "$lib/paramCtrls";
    import { current } from "../../../routes/builder/globals.svelte";
    import { translate } from "$lib/translation";

    let {
        /** @bindable @type {Boolean} State dictating whether this dialog is shown */
        shown=$bindable(),
        /** @interface */
        children=undefined
    } = $props();

    let useRegex = $state(false)
    let caseSensitive = $state(false)
    let searchTerm = $state("");

    let results = $derived(
        current.experiment.search(searchTerm, useRegex, caseSensitive)
    )

    let dialog = $state({
        shown: false,
        element: undefined
    });

</script>

<Dialog
    id=find-in-experiment
    title={translate("Find in experiment...")}
    onopen={(evt) => searchTerm = ""}
    buttons={{
        OK: (evt) => {},
    }}
    bind:shown={shown}
>
    <div class=container>
        <div
            class=find-ctrls
        >
            <input 
                type=text 
                placeholder={translate("Search...")}
                class=search-bar
                bind:value={searchTerm}
            >
            <ToggleButton 
                bind:value={useRegex} 
                icon="/icons/btn-regex.svg"
                tooltip={translate("Use RegEx syntax")}
            />
            <ToggleButton 
                bind:value={caseSensitive} 
                icon="/icons/btn-case.svg"
                tooltip={translate("Use case-sensitive searching")}
            />
        </div>
        <div class=results-list>
            {#each results as result}
            <div
                class=result-item
            >
                <div class=item-breadcrumbs>
                    {#if result.breadcrumbs.loop}
                        <button 
                            class=breadcrumb
                            onclick={(evt) => {
                                // open loop dialog
                                dialog.element = result.breadcrumbs.loop
                                dialog.shown = true
                                // close this dialog
                                shown = false;
                            }}
                        >{result.breadcrumbs.loop.name}</button>
                    {/if}
                    {#if result.breadcrumbs.routine}
                        <button 
                            class=breadcrumb
                            onclick={(evt) => {
                                // navigate to routine
                                current.routine = result.breadcrumbs.routine
                                // close this dialog
                                shown = false;
                            }}
                        >{result.breadcrumbs.routine.name}</button>
                    {/if}
                    {#if result.breadcrumbs.component}
                        >
                        <button 
                            class=breadcrumb
                            onclick={(evt) => {
                                // navigate to routine
                                current.routine = result.breadcrumbs.component.routine
                                // open component dialog
                                dialog.element = result.breadcrumbs.component
                                dialog.shown = true
                                // close this dialog
                                shown = false;
                            }}
                        >{
                            ["RoutineSettingsComponent", "SettingsComponent"].includes(result.breadcrumbs.component.tag)
                            ? "settings"
                            : result.breadcrumbs.component.name
                        }</button>
                    {/if}
                    {#if result.breadcrumbs.param}
                        > {result.breadcrumbs.param.name}
                    {/if}
                </div>
                <div class=item-content>{result.text.before}<b>{result.text.text}</b>{result.text.after}</div>
            </div>
            {/each}
        </div>
    </div>
    {@render children?.()}
</Dialog>

<!-- dialog to view results -->
{#if dialog.element}
    <ParamsDialog 
        element={dialog.element}
        onclose={() => dialog.element = undefined}
        bind:shown={dialog.shown} 
    />
{/if}

<style>
    button {
        position: relative;
        background-color: transparent;
        border: 1px solid var(--overlay);
        border-radius: .5rem;
        transition: border-color .2s, box-shadow .2s, background-color .2s, color .2s;
        box-shadow: 
            inset -1px -1px 2px rgba(0, 0, 0, 0.025)
        ;
    }

    button:disabled {
        opacity: 50%;
    }
    button:enabled:hover,
    button:enabled:focus {
        outline: none;
        border-color: var(--blue);
        box-shadow: 
            inset 1px 1px 10px rgba(0, 0, 0, 0.05)
        ;
    }
    button:disabled {
        opacity: 50%;
    }
    button:enabled:hover,
    button:enabled:focus {
        outline: none;
        border-color: var(--blue);
        box-shadow: 
            inset 1px 1px 10px rgba(0, 0, 0, 0.05)
        ;
    }

    .container {
        display: grid;
        position: relative;
        grid-template-rows: min-content 1fr;
        padding: 1rem;
        height: 100%;
        box-sizing: border-box;
        gap: 1rem;
    }
    .find-ctrls {
        display: flex;
        flex-wrap: nowrap;
        gap: .5rem;
    }
    .search-bar {
        flex-grow: 1;
        min-width: 30rem;
    }
    .results-list {
        display: flex;
        flex-direction: column;
        gap: .5rem;
        overflow-y: auto;
    }
    .result-item {
        padding: .5rem 1rem;
        border-radius: .5rem;
        border: 1px solid var(--overlay);
        background-color: var(--base);
        display: grid;
        grid-template-rows: [breadcrumbs] min-content [content] min-content [end];
    }
    .result-item .item-breadcrumbs {
        grid-row-start: breadcrumbs;

        display: flex;
        flex-direction: row;
        gap: .5rem;
        margin: .5rem 0;
        align-items: center;
    }

    .result-item .item-content {
        font-family: var(--mono);
        padding: .5rem;
        margin: .5rem;
        border-left: 1px solid var(--blue);
        text-align: left;
    }
    .result-item .item-content b {
        font-family: var(--mono);
    }

    .breadcrumb {
        padding: .25rem .5rem;
    }
</style>