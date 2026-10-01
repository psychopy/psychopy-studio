<script>
    import { electron } from "$lib/globals.svelte";

    let {
        experiment
    } = $props()

    $effect(() => {
        // skip if no experiment or not an experiment (e.g. a runner script)
        if (!experiment?.needsKeyboardAccess) {
            return
        }
        // skip if already asked
        if (experiment?.prompts?.keyboardAccess) {
            return
        }
        // does the experiment need keyboard permissions?
        experiment.needsKeyboardAccess().then(
            async needs => {
                // abort if already has access or doesn't need it
                if (!needs || await electron.system.hasKeyboardAccess()) {
                    return
                }
                // request access
                await electron.system.requestKeyboardAccess()
                // mark as already asked
                experiment.prompts.keyboardAccess = true
            }
        )
    })

</script>
