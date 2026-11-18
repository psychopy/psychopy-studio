<script>
    import { validateSurvey } from "./validators.svelte.js";
    import SingleLineCtrl from "./SingleLineCtrl.svelte"
    import { Button } from "$lib/ui/button"
    import { getContext } from "svelte";
    import Dialog from "$lib/ui/dialog/Dialog.svelte";
    import { DialogButton } from "$lib/ui/dialog";
    import { Icon } from "$lib/ui/icon";
    import { ChooseSurvey, getSurveys } from "$lib/pavlovia/surveys"
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

    let showSurveysDlg = $state.raw();

    let selected = $state.raw();
</script>

<div class=ctrls>
    <SingleLineCtrl 
        param={param} 
        disabled={disabled}
        {@attach element => param.registerValidator("survey", validateSurvey, -5)}
        {...attachments}
    />

    <Button
        icon="/icons/btn-find.svg"
        tooltip={translate("Search your surveys on Pavlovia")}
        onclick={(evt) => showSurveysDlg = true}
        disabled={disabled || current.user === undefined}

        small
    />

    
        {#await getSurveys(current.user)}
            {translate("Getting survey name...")}
        {:then surveys}
            {#each surveys.surveys.filter(survey => survey.surveyId === param.val) as survey}
                <div class=survey-name>
                    <h4>
                        {survey.surveyName}
                    </h4>
                    <div class=status>
                        <Icon 
                            src="/icons/sym-dot-{survey.status === "RUNNING" ? "green" : survey.status === "PILOTING" ? "orange" : "light"}.svg"
                            size=.8rem
                        />
                        <code>{survey.status}</code>
                    </div>
                    <span>
                        <a href="https://gitlab.pavlovia.org/{survey.creatorUsername}">
                            {survey.creatorName}
                        </a>
                        /
                        <a href="https://pavlovia.org/surveys/{survey.surveyId}">
                            {survey.surveyId}
                        </a>
                    </span>
                </div>
            {/each}
        {/await}
</div>


<Dialog
    data-testid=browse-surveys
    title={translate("Pavlovia surveys")}
    bind:shown={showSurveysDlg}
    onopen={evt => selected = param.val}
>
    <div class=dlg-container>
        <p>
            {translate("Below are all of the surveys linked to your Pavlovia account - select the one you want and press OK to add its ID. You can view and manage your Pavlovia surveys ")}
            <a href="https://pavlovia.org/dashboard?tab=4" target="_blank">here</a>
        </p>
        <ChooseSurvey 
            bind:selection={selected}
        />
    </div>
    {#snippet buttons()}
        <DialogButton
            action=OK
            onclick={evt => param.val = selected}
            disabled={selected === undefined}
        />
        <DialogButton action=CANCEL />
    {/snippet}
</Dialog>

<style>
    .dlg-container {
        padding: 1rem;
        display: flex;
        flex-direction: column;
    }

    .ctrls {
        display: grid;
        grid-template-columns: [start] 1fr [ctrls] min-content [end];
        flex-grow: 1;
        gap: 0 .5rem;
    }

    .survey-name {
        display: grid;
        grid-template-columns: 1fr min-content;
        border: 1px solid var(--overlay);
        border-radius: .5rem;
        grid-column-start: start;
        padding: 1rem 2rem;
        margin: 1rem;
    }
    .survey-name h4 {
        margin-top: 0;
    }

    .status {
        display: flex;
        flex-direction: row;
        flex-wrap: nowrap;
        align-items: center;
        gap: .5rem;
    }

</style>