<script>
    import RoutineCanvas from './Canvas.svelte';
    import StandaloneRoutineCanvas from './Standalone.svelte'
    import { StandaloneRoutine, Routine } from '$lib/experiment';
    import { Notebook, NotebookPage, ButtonTab } from '$lib/utils/notebook';
    import { getContext } from "svelte";
    import { Dialog } from '$lib/utils/dialog';
    import { ParamsNotebook } from '$lib/paramCtrls';
    import { translate } from "$lib/translation";
    
    let current = getContext("current");
    let showNewRoutineDialog = $state.raw(false)
    let valid = $state({})

    let btnsDisabled = $derived({
        OK: Object.values(valid).some(
            (val) => !val.state
        ),
        APPLY: Object.values(valid).some(
            (val) => !val.state
        )
    })
</script>

<Notebook>
    {#if current.experiment !== null}
        {#each Object.entries(current.experiment.routines) as [name, routine]}
            <NotebookPage 
                bind:selected={
                    () => {return current.routine === routine},
                    (value) => {current.routine = routine}
                }
                bind:label={
                    () => routine.name,
                    (value) => routine.settings.params['name'].val = value
                }
                close={() => {
                    current.experiment.history.update()
                    delete current.experiment.routines[name]
                }}
                closeTooltip={translate("Delete {}").replace("{}", name)}
                data={routine}
            >
                {#if routine instanceof Routine}
                    <RoutineCanvas routine={routine} />
                {:else if current.experiment.routines[name] instanceof StandaloneRoutine}
                    <StandaloneRoutineCanvas component={routine} />
                {/if}
            </NotebookPage>
        {/each}
    {/if}
    <ButtonTab
        callback={(evt) => {
            // create blank Routine
            current.inserting = new Routine()
            // show dialog
            showNewRoutineDialog = true
        }}
        tooltip={translate("New Routine...")}
    ></ButtonTab>
</Notebook>

<!-- dialog for creating a new Routine -->
{#if current.inserting instanceof Routine}
    <Dialog 
        id=new-routine
        title="New Routine" 
        bind:shown={showNewRoutineDialog} 
        onopen={() => current.inserting.settings.restore.set()}
        buttons={{
            OK: (evt) => {
                // add to experiment
                current.inserting.exp = current.experiment
                current.experiment.routines[current.inserting.name] = current.inserting
            }, 
            CANCEL: (evt) => {
                current.inserting.settings.restore.apply()
                // stop inserting
                current.inserting = undefined;
            },  
            HELP: "https://www.psychopy.org/builder/routines.html#routines",
        }}
        buttonsDisabled={btnsDisabled}
    >
        <ParamsNotebook 
            bind:valid={valid}
            element={current.inserting.settings}
        ></ParamsNotebook>
    </Dialog>
{/if}