<script>
    import { StandaloneRoutine, Routine, Component } from '$lib/experiment';
    import { Button } from '$lib/utils/buttons';
    import { getContext } from "svelte";
    import Dialog from "$lib/utils/dialog/Dialog.svelte";
    import { ParamsNotebook } from "$lib/paramCtrls";
    import { translate } from "$lib/translation";
    
    let current = getContext("current");

    let {
        component
    } = $props()
    
    let dlgComponent = $state(
        new Component(component['__name__'])
    );
    let showDialog = $state()

    function titleCase(name) {
        name = name.replace("Component", "");
        name = name.replace("Routine", "");

        name = name.replace(/(\w)([A-Z])/g, "$1 $2")

        return name;
    }

    function newComponent() {
        // create a new Component for the dialog
        dlgComponent = new Component(component['__name__'])
        // show dialog
        showDialog = true
    }

    let valid = $derived(
        Object.values(dlgComponent.params).every(
            param => param.valid?.value
        )
    )

    let btnsDisabled = $derived({
        OK: !valid,
        APPLY: !valid
    })
        
</script>

{#if !component.hidden}
<Button 
    label={titleCase(component['__name__'])}
    icon={component.iconSVG}
    vertical
    disabled={!(current.routine instanceof Routine)}
    onclick={newComponent}
/>

<Dialog 
    id=new-component
    title={translate("New {}").replace("{}", titleCase(component['__name__']))}
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
{/if}