<script>
    import { StandaloneRoutine, Routine, Component } from '$lib/experiment';
    import { Button } from '$lib/utils/buttons';
    import { getContext } from "svelte";

    let current = getContext("current");

    let {
        component
    } = $props()

    function titleCase(name) {
        name = name.replace("Component", "");
        name = name.replace("Routine", "");

        name = name.replace(/(\w)([A-Z])/g, "$1 $2")

        return name;
    }

    function newRoutine() {
        // update history
        current.experiment.history.update(`new Routine`)
        // create a new StandaloneRoutine
        let rt = new StandaloneRoutine(component['__name__'])
        rt.exp = current.experiment;
        // add it to the experiment
        current.experiment.routines[rt.name] = rt
        // navigate to it
        current.routine = rt
        // insert into the flow
        current.inserting = rt
    }
    
</script>

{#if !component.hidden}
<Button 
    label={titleCase(component['__name__'])}
    icon={component.iconSVG}
    vertical
    onclick={newRoutine}
/>
{/if}