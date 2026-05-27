<script>
    import { Routine } from "$lib/experiment"
    import { Menu, MenuItem } from '$lib/utils/menu';
    import Dialog from '$lib/utils/dialog/Dialog.svelte';
    import { ParamsNotebook } from '$lib/paramCtrls/index.js';
    import { Button } from '$lib/utils/buttons';
    import { getContext } from "svelte";
    import { translate } from "$lib/translation";
    
    let current = getContext("current");
    
    let showNewRoutineDialog = $state(false)
    let showMenu = $state(false)
</script>

<div
    class=container
>
    <!-- button to open add Routine menu -->
    <Button 
        label={translate("Add Routine")}
        icon="/icons/btn-routine.svg"
        tooltip={translate("Add a Routine to the experiment flow")}
        onclick={() => {
            // open the "add routine" menu
            showMenu = true
        }}
        disabled={current.inserting}
        horizontal
    ></Button>
    
    <!-- menu for adding a Routine -->
    <Menu 
        bind:shown={showMenu}
    >
        <MenuItem 
            label={translate("New Routine...")}
            onclick={() => {
                // create blank Routine
                current.inserting = new Routine()
                // show dialog
                showNewRoutineDialog = true
            }}
        />
        {#each Object.entries(current.experiment.routines) as [name, routine]}
        <MenuItem 
            label={name}
            onclick={() => {
                // set this Routine as the one to insert
                current.inserting = routine
            }}
        />
        {/each}
    </Menu>
</div>

<!-- dialog for creating a new Routine -->
{#if current.inserting instanceof Routine}
    <Dialog 
        id=new-routine
        title={translate("New Routine")}
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
        buttonsDisabled={{
            OK: !Object.values(current.inserting.settings.params).every(
                param => param.valid?.value
            ),
            APPLY: !Object.values(current.inserting.settings.params).every(
                param => param.valid?.value
            ),
        }}
    >
        <ParamsNotebook 
            element={current.inserting.settings}
        />
    </Dialog>
{/if}


<style>
    .container {
        position: relative;
        display: grid;
        justify-content: stretch;
    }
</style>