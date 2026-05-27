<script>
    import SingleLineCtrl from "./SingleLineCtrl.svelte"
    import { CompactButton, RadioButton } from "$lib/utils/buttons"
    import { getContext } from "svelte";
    import Dialog from "$lib/utils/dialog/Dialog.svelte";
    import { translate } from "$lib/translation";

    let {
        /** @prop @type {import("$lib/experiment").Param} Param object to which this ctrl pertains */
        param=$bindable(),
        /** @prop @type {boolean} Controls whether this control is disabled */
        disabled=false,
        /** @interface */
        ...attachments
    } = $props()

    let current = getContext("current")

    function validateSurvey(param, valid) {}

    let showSurveysDlg = $state.raw();

    let selected = $state({
        survey: undefined
    });

    async function getSurveys() {
        // request from Pavlovia
        let data = await fetch(
            "/api/surveys",
            {
                headers: current.user.token
            }
        ).then(
            resp => resp.json()
        )

        return data.surveys
    }
</script>

<SingleLineCtrl 
    param={param} 
    disabled={disabled}
    {@attach element => param.registerValidator("survey", validateSurvey, -5)}
    {...attachments}
/>

<CompactButton 
    icon="/icons/btn-find.svg"
    tooltip={translate("Browse your projects on Pavlovia")}
    onclick={(evt) => showSurveysDlg = true}
    disabled={disabled || current.user === undefined}
/>

<Dialog
    id=browse-surveys
    title={translate("Pavlovia surveys")}
    buttons={{
        OK: (evt) => param.val = selected.survey.surveyId,
        CANCEL: (evt) => {}
    }}
    buttonsDisabled={{
        OK: selected.survey === undefined
    }}
    bind:shown={showSurveysDlg}
>
    <div class=container>
        <p>
            {translate("Below are all of the surveys linked to your Pavlovia account - select the one you want and press OK to add its ID. You can view and manage your Pavlovia surveys ")}
            <a href="https://pavlovia.org/dashboard?tab=4" target="_blank">here</a>
        </p>
        <div class=choice-group>
            {#await getSurveys()}
                {translate("Loading surveys...")}
            {:then surveys}
                {#each surveys as survey}
                    <RadioButton
                        bind:selection={selected.survey}
                        value={survey}
                        label={survey.surveyName}
                        tooltip={survey.description}
                    />
                {/each}
            {:catch err}
                <p class=error>
                    {err}
                </p>
            {/await}
        </div>
    </div>
</Dialog>

<style>
    .container {
        padding: 1rem;
        display: flex;
        flex-direction: column;
        width: 45rem;
        height: 100%;
        box-sizing: border-box;
    }

    .choice-group {
        background: var(--base);
        border: 1px solid var(--overlay);
        display: flex;
        flex-direction: column;
        align-items: stretch;
        flex-grow: 1;
        overflow-y: auto;
        max-width: 65rem;
        gap: .5rem;
        padding: 1rem;
    }

    p.error {
        color: var(--red);
    }

</style>