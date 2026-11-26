<script>
    import { ParamsNotebook } from "$lib/ui/paramCtrls";
    import { Button } from "$lib/ui/button";
    import { Dialog } from "$lib/ui/dialog";
    import { AlertsOutput } from "$lib/python/alerts";
    import { translate } from "$lib/translation";
    import { onMount, untrack } from "svelte";

    let {
        routine
    } = $props();

    onMount(() => routine.restore.set())

    let show = $state({
        alertsDlg: false
    })

    // update history when Routine has changes
    $effect(() => {
        // read the restore point without depending on it
        let restorePoint = untrack(() => $state.snapshot(routine.restore.point))
        // check each param for a change
        let changed = Object.entries(routine.params).map(
            ([name, param]) => !param.matches(
                (restorePoint || routine).params[name]
            )
        )
        // if any params have changed, apply changes
        if (changed.some(val => val)) {
            untrack(() => routine.restore.set())
        }
    })

    // update reference in Experiment when this Routine is renamed
    $effect(() => {
        if (routine.exp && routine.valid) {
            routine.exp.renameRoutine(
                routine, 
                $state.snapshot(routine.params['name'].val)
            )
        }
    })
</script>

<div class=standalone-routine-canvas>
    <div class=notebook-container>
        <ParamsNotebook 
            bind:element={routine}
            wide
        />
    </div>
    <div class=ctrls>
        {#if routine.alerts.length}
            <Button 
                label={translate("Alerts")}
                onclick={evt => show.alertsDlg = true}
                tooltip={translate("Click to view alerts about this Routine")}
                icon="/icons/sym-warning.svg"
                small
            />
        {/if}
    </div>
</div>

<Dialog
    title={translate("Alerts for {}").replaceAll("{}", routine.name)}
    buttons={["OK"]}
    bind:shown={show.alertsDlg}
    closable
>
    <AlertsOutput 
        bind:alerts={routine.alerts}
    />
</Dialog>

<style>
    .standalone-routine-canvas {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        height: 100%;
        width: min-width;
        margin: 0 auto;
        padding: 1rem;
        box-sizing: border-box;
    }
    
    .notebook-container {
        flex-grow: 1;
        min-height: 0;
    }

    .ctrls {
        display: flex;
        flex-direction: row;
        gap: .5rem;
        justify-content: start;
        padding: 0 1rem;
    }
</style>