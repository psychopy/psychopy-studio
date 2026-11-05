<script>
    import { StandaloneRoutine, Routine, Component } from '$lib/experiment';
    import { Button } from '$lib/ui/button';
    import { getContext, untrack } from "svelte";
    import Dialog from "$lib/ui/dialog/Dialog.svelte";
    import { DialogButton } from "$lib/ui/dialog";
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
        // make name valid
        if (dlgComponent.params['name']) {
            dlgComponent.params['name'].val = current.experiment.resolveNameConflict(dlgComponent.name)
        }
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

<Button
    label={titleCase(element.tag)}
    tooltip={element.tooltip}
    icon={element.iconSVG}
    disabled={element instanceof Component && !(current.routine instanceof Routine)}
    onclick={element instanceof Component ? newComponent : newRoutine}
    vertical
    large
/>

{#if element instanceof Component}
    <Dialog
        id=new-component
        title={translate("New {}").replace("{}", titleCase(element.tag))}
        bind:shown={showDialog}
        onopen={() => dlgComponent.restore.set()}
    >
        <ParamsNotebook
            element={dlgComponent}
            wide
        />
        {#snippet buttons()}
            <DialogButton
                role=OK
                onclick={(evt) => {
                    // add to experiment
                    current.routine.addComponent(dlgComponent);
                    // set restore point
                    dlgComponent.restore.set()
                }}
                disabled={btnsDisabled.OK}
            />
            <DialogButton
                role=CANCEL
                onclick={() => dlgComponent.restore.apply()}
            />
            {#if dlgComponent.helpLink}
                <DialogButton
                    role=HELP
                    onclick={dlgComponent.helpLink}
                />
            {/if}
        {/snippet}
    </Dialog>
{/if}
