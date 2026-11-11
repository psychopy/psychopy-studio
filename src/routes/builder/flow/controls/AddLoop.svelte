<script>
    import { LoopInitiator } from '$lib/experiment/flow.svelte.js';
    import { ParamsNotebook } from '$lib/ui/paramCtrls/index.js';
    import { Menu, MenuItem } from '$lib/ui/menu';
    import { Button } from '$lib/ui/button';
    import { getContext } from "svelte";
    import Dialog from "$lib/ui/dialog/Dialog.svelte";
    import { DialogButton } from "$lib/ui/dialog";
    import { profiles } from "$lib/experiment/profiles.svelte";
    import { translate } from "$lib/translation";
    
    let current = getContext("current");

    let showDialog = $state(false)
    let showMenu = $state(false);

    let valid = $derived.by(() => {
        if (current.inserting) {
            return Object.values(current.inserting.params).every(
                param => param.valid?.value
            )
        } else {
            true
        }
    })

    let btnsDisabled = $derived({
        OK: !valid,
        APPLY: !valid
    })

</script>

<div
    class=container
>
    <!-- button to open add Loop menu -->
    <Button 
        label={translate("Add Loop")}
        icon="/icons/btn-loop.svg"
        tooltip={translate("Add a loop to the experiment flow")}
        onclick={() => showMenu = true}
        disabled={current.inserting}
        horizontal
        stretch
    />

    <!-- menu for choosing new loop type -->
    <Menu 
        bind:shown={showMenu}
    >
        {#await profiles.loops.pending.promise}
            <MenuItem 
                label={translate("Loading loops...")}
            />
        {:then}
            {#each Object.entries(profiles.loops.value) as [loopType, loopProfile]}
                {#if !loopProfile.hidden}
                    <MenuItem 
                        label={translate("New {}...").replace("{}", loopProfile.label?.toLowerCase?.() || loopType)}
                        onclick={() => {
                            // create blank Loop
                            current.inserting = new LoopInitiator(loopType)
                            current.inserting.exp = current.experiment;
                            // make name valid
                            if (current.inserting.params['name']) {
                                current.inserting.params['name'].val = current.experiment.resolveNameConflict(current.inserting.name)
                            }
                            // show dialog
                            showDialog = true
                        }}
                    />
                {/if}
            {/each}
        {:catch}
            <MenuItem 
                label={translate("Failed to load loops")}
            />
        {/await}
    </Menu>

    <!-- dialog for creating a new Loop -->
    {#if current.inserting instanceof LoopInitiator}
    <Dialog 
        data-testid=new-loop 
        title={translate("New loop")}
        bind:shown={showDialog} 
        onopen={() => current.inserting.restore.set()}
    >
        <ParamsNotebook 
            bind:valid={valid}
            element={current.inserting}
        />
        {#snippet buttons()}
            <DialogButton
                action=OK
                disabled={btnsDisabled.OK}
            />
            <DialogButton
                action=CANCEL
                onclick={(evt) => {
                    current.inserting.restore.apply()
                    // stop inserting
                    current.inserting = undefined;
                }}
            />
            <DialogButton
                action=HELP
                onclick="https://www.psychopy.org/builder/flow.html#loops"
            />
        {/snippet}
    </Dialog>
    {/if}
</div>

<style>
    .container {
        position: relative;
        display: grid;
        justify-content: stretch;
    }
</style>