<script>
    import { ParamsNotebook } from "$lib/ui/paramCtrls";
    import { onMount, untrack } from "svelte";

    let {
        routine
    } = $props();

    onMount(() => routine.restore.set())

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
</div>

<style>
    .standalone-routine-canvas {
        display: grid;
        gap: 1rem;
        grid-template-rows: [canvas] 1fr [ctrls] min-content;
        justify-content: center;
        padding: 1rem;
        height: 100%;
        box-sizing: border-box;
    }

    .notebook-container {
        max-width: 55rem;
    }
</style>