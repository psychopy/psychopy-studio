<script>
    import { RadioButton } from "$lib/ui/button";
    import { SearchCtrl } from "$lib/ui/input";
    import { translate } from "$lib/translation";
    import { getSurveys } from "./functions.svelte";
    import { getContext } from "svelte";

    let {
        selection=$bindable(),
        searchTerm=$bindable()
    } = $props()

    let current = getContext("current");

    let requestSurveys = $derived(
        getSurveys(current.user)
    )
</script>

<div class=container>
    <SearchCtrl 
        bind:value={searchTerm}
        placeholder={translate("Search surveys...")}
    />
    <div class=results>
        {#await requestSurveys}
            {translate(
                "Loading surveys..."
            )}
        {:then resp}
            {#each resp.surveys.filter(
                survey => survey.surveyName.includes(searchTerm || "")
            ) as survey}
                <RadioButton 
                    bind:selection={selection}
                    value={survey.surveyId}
                    label={survey.surveyName}
                    tooltip={survey.description}
                    data={survey}
                    opaque
                    large
                />
            {/each}
        {/await}
    </div>
</div>

<style>
    .container {
        display: flex;
        flex-direction: column;
        gap: .5rem;
        min-width: 35rem;
        min-height: 20rem;
    }

    .results {
        display: flex;
        flex-direction: column;
        gap: .5rem;
        padding: 1rem;
    }
</style>
