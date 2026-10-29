<script>
    import { StandaloneRoutine, Routine, Component } from '$lib/experiment';
    import { Button } from '$lib/ui/button';
    import { getContext, untrack } from "svelte";
    import Dialog from "$lib/ui/dialog/Dialog.svelte";
    import { ParamsNotebook } from "$lib/ui/paramCtrls";
    import { translate } from "$lib/translation";

    let current = getContext("current");

    let {
        /** @prop @type {Component|StandaloneRoutine} Element to add a new copy of when this button is clicked */
        element
    } = $props()

    // new Component to edit in the dialog before adding it (unused for StandaloneRoutines, as they're added straight away)
    let dlgComponent = $state.raw(
        untrack(() => element instanceof Component ? new Component(element.tag) : undefined)
    );
    let showDialog = $state()

    function titleCase(name) {
        // remove "Component" or "Routine" from the end of the class name
        name = name.replace("Component", "");
        name = name.replace("Routine", "");
        // convert CamelCase to Title Case
        name = name.replace(/(\w)([A-Z])/g, "$1 $2")

        return name;
    }

    function newComponent() {
        // create a new Component for the dialog
        dlgComponent = new Component(element.tag)
        // show dialog
        showDialog = true
    }

    function newRoutine() {
        // update history
        current.experiment.history.update(`new Routine`)
        // create a new StandaloneRoutine
        let rt = new StandaloneRoutine(element.tag)
        // add it to the experiment
        current.experiment.addRoutine(rt)
        // navigate to it
        current.routine = rt
        // insert into the flow
        current.inserting = rt
    }

    let valid = $derived(
        dlgComponent === undefined || Object.values(dlgComponent.params).every(
            param => param.valid?.value
        )
    )

    let btnsDisabled = $derived({
        OK: !valid,
        APPLY: !valid
    })

</script>

{#if element instanceof Component}
    <Button
        label={titleCase(element.tag)}
        icon={element.iconSVG}
        disabled={!(current.routine instanceof Routine)}
        onclick={newComponent}
        vertical
        large
    />

    <Dialog
        id=new-component
        title={translate("New {}").replace("{}", titleCase(element.tag))}
        bind:shown={showDialog}
        onopen={() => dlgComponent.restore.set()}
        buttons={{
            OK: (evt) => {
                // add to experiment
                current.routine.addComponent(dlgComponent);
                // set restore point
                dlgComponent.restore.set()
            },
            CANCEL: () => dlgComponent.restore.apply(),
            HELP: dlgComponent.helpLink
        }}
        buttonsDisabled={btnsDisabled}
    >
        <ParamsNotebook
            element={dlgComponent}
        />
    </Dialog>
{:else if element instanceof StandaloneRoutine}
    <Button
        label={titleCase(element.tag)}
        icon={element.iconSVG}
        onclick={newRoutine}
        vertical
        large
    />
{/if}
