<script>
    import { python } from "$lib/globals.svelte";
    import { translate } from "$lib/translation";

    let {
        value=$bindable(),
        target="param"
    } = $props();

    let dkl = $state([
        90, 0, 1
    ])

    // transform theDKL values into PsychoPy RGB values (-1:1) for the preview
    let preview = $derived(
        // send value to Python for conversion
        python.liaison.send("app", {
            command: "init",
            args: ["rgb", "psychopy.tools.colorspacetools:dkl2rgb", $state.snapshot(dkl)]
        }, 1000).then(
            name => {
                // convert returned value from numpy to JSON
                return python.liaison.send("app", {
                    command: "run",
                    args: ["numpy:ndarray.tolist", `\$${name}`]
                }, 1000).then(
                    // transform the PsychoPy RGB values (-1:1) into CSS RGB (0:255)
                    rgb => rgb.map(val => (val + 1) * 255 / 2)
                )
            }
        )
    )
    
    $effect(() => {
        value = target === "param" ? `$[${dkl.join(", ")}]` : `[${dkl.join(", ")}]`
    })
</script>

<div class=page>
    <div class=ctrls>
        <!-- elevation -->
        <div class=ctrl>
            <div class=label>{translate("Elevation")}</div>
            <input 
                type=number 
                bind:value={dkl[0]}
                min=0
                max=360
            />
        </div>
        <!-- azimuth -->
        <div class=ctrl>
            <div class=label>{translate("Azimuth")}</div>
            <input 
                type=number 
                bind:value={dkl[1]}
                min=0
                max=360
            />
        </div>
        <!-- blue -->
        <div class=ctrl>
            <div class=label>{translate("Contrast")}</div>
            <input 
                type=number 
                bind:value={dkl[2]}
                min={-1}
                max=1
                step=0.05
            />
        </div>
    </div>
    {#if python?.ready}
        {#await preview}
            <div class=preview>
            </div>
        {:then preview}
            <div 
                class=preview
                style:background-color=rgba({preview})
            ></div>
        {:catch err}
            <div class=preview>
                {err.error}
            </div>
        {/await}
    {:else}
        <div class=preview>
            {translate("DKL preview is not available in browser.")}
        </div>
    {/if}
</div>

<style>
    .page {
        display: flex;
        flex-direction: row;
        gap: 1rem;
        width: 100%;
    }
    .ctrls {
        display: flex;
        flex-direction: column;
        gap: .5rem;
        flex-grow: 1;
    }
    .ctrl .label {
        grid-column-end: end;
        grid-column-start: start;
    }
    .ctrl {
        display: grid;
        grid-template-columns: [start] 1fr max-content[end];
        gap: .25rem .5rem;
        align-items: center;
    }
    .preview {
        width: 10rem;
        border: 1px solid var(--overlay);
        padding: 1rem;
        box-sizing: border-box;
    }
</style>