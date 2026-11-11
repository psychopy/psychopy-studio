<script>
    import { Button, ToggleButton } from "$lib/ui/button";
    import { Icon } from "$lib/ui/icon";
    import { SearchCtrl } from "$lib/ui/input";
    import { Dialog } from "$lib/ui/dialog";
    import { ParamsDialog } from "$lib/ui/paramCtrls";
    import { current } from "../../../routes/builder/globals.svelte";
    import { translate } from "$lib/translation";

    let {
        /** @bindable @type {Boolean} State dictating whether this dialog is shown */
        shown=$bindable(),
        /** @interface */
        children=undefined
    } = $props();

    let searchTerm = $state("");

    let results = $derived(
        current.experiment.search(searchTerm, params.useRegex, params.caseSensitive)
    )

    let dialog = $state({
        shown: false,
        element: undefined
    });

    let params = $state({
        useRegex: false,
        caseSensitive: false
    })

</script>

<Dialog
    data-testid=find-in-experiment
    title={translate("Find in experiment...")}
    onopen={(evt) => searchTerm = ""}
    bind:shown={shown}
    buttons={["OK"]}
>
    <div class=container>  
        <SearchCtrl 
            bind:value={searchTerm}
            bind:params={params}
        >
            {#snippet ctrls(params)}
                <ToggleButton 
                    bind:value={params.useRegex} 
                    icon="/icons/btn-regex.svg"
                    tooltip={translate("Use RegEx syntax")}
                    small
                />
                <ToggleButton 
                    bind:value={params.caseSensitive} 
                    icon="/icons/btn-case.svg"
                    tooltip={translate("Use case-sensitive searching")}
                    small
                />
            {/snippet}
        </SearchCtrl>

        <div class=results-list>
            {#each results as result}
            <div
                class=result-item
            >
                <div class=item-breadcrumbs>
                    {#if result.breadcrumbs.loop}
                        <Button 
                            label={result.breadcrumbs.loop.name}
                            onclick={(evt) => {
                                // open loop dialog
                                dialog.element = result.breadcrumbs.loop
                                dialog.shown = true
                                // close this dialog
                                shown = false;
                            }}
                            tight
                        />
                    {/if}
                    {#if result.breadcrumbs.routine}
                        <Button 
                            label={result.breadcrumbs.routine.name}
                            onclick={(evt) => {
                                // navigate to routine
                                current.routine = result.breadcrumbs.routine
                                // close this dialog
                                shown = false;
                            }}
                            tight
                        />
                    {/if}
                    {#if result.breadcrumbs.component}
                        <Icon 
                            src="/icons/sym-arrow-right.svg"
                            size=".5rem"
                        />
                        <Button 
                            label={
                                ["RoutineSettingsComponent", "SettingsComponent"].includes(result.breadcrumbs.component.tag)
                                ? "settings"
                                : result.breadcrumbs.component.name
                            }
                            onclick={(evt) => {
                                // navigate to routine
                                current.routine = result.breadcrumbs.component.routine
                                // open component dialog
                                dialog.element = result.breadcrumbs.component
                                dialog.shown = true
                                // close this dialog
                                shown = false;
                            }}
                            tight
                        />
                    {/if}
                    {#if result.breadcrumbs.param}
                        <Icon 
                            src="/icons/sym-arrow-right.svg"
                            size=".5rem"
                        />
                        {result.breadcrumbs.param.name}
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

    .container {
        display: flex;
        flex-direction: column;
        position: relative;
        grid-template-rows: min-content 1fr;
        padding: 1rem;
        min-width: 35rem;
        box-sizing: border-box;
        gap: 1rem;
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
</style>