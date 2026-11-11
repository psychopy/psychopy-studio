<script>
    import RoutineCanvas from './Canvas.svelte';
    import StandaloneRoutineCanvas from './Standalone.svelte'
    import { StandaloneRoutine, Routine } from '$lib/experiment';
    import { Notebook, NotebookPage, ButtonTab } from '$lib/ui/notebook';
    import { getContext } from "svelte";
    import { Dialog, DialogButton } from '$lib/ui/dialog';
    import { ParamsNotebook } from '$lib/ui/paramCtrls';
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

<Notebook
    id=routines-notebook
>
    {#snippet placeholder()}
        {#if current.experiment.loading}
            <div class=loading-msg>
                {translate("Loading {}...").replace("{}", current.experiment.loading.name)}
            </div>
        {/if}
    {/snippet}
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
                    <StandaloneRoutineCanvas routine={routine} />
                {/if}
            </NotebookPage>
        {/each}
    {/if}
    <!-- creating a Routine needs profiles, so wait for them -->
    {#await current.experiment.ready then}
        <ButtonTab
            callback={(evt) => {
                // create blank Routine
                current.inserting = new Routine()
                // show dialog
                showNewRoutineDialog = true
            }}
            tooltip={translate("New Routine...")}
        ></ButtonTab>
    {:catch}
    {/await}
</Notebook>

<!-- dialog for creating a new Routine -->
{#if current.inserting instanceof Routine}
    <Dialog 
        data-testid=new-routine
        title="New Routine" 
        bind:shown={showNewRoutineDialog} 
        onopen={() => current.inserting.settings.restore.set()}
    >
        <ParamsNotebook 
            bind:valid={valid}
            element={current.inserting.settings}
        ></ParamsNotebook>
        {#snippet buttons()}
            <DialogButton
                action=OK
                onclick={(evt) => {
                    // add to experiment
                    current.inserting.exp = current.experiment
                    current.experiment.routines[current.inserting.name] = current.inserting
                }}
                disabled={btnsDisabled.OK}
            />
            <DialogButton
                action=CANCEL
                onclick={(evt) => {
                    current.inserting.settings.restore.apply()
                    // stop inserting
                    current.inserting = undefined;
                }}
            />
            <DialogButton
                action=HELP
                onclick="https://www.psychopy.org/builder/routines.html#routines"
            />
        {/snippet}
    </Dialog>
{/if}
<style>
    .loading-msg {
        color: var(--outline);
    }
</style>
