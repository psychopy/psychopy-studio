<script>
    import { translate } from "$lib/translation";

    let {
        value=$bindable(),
        target="param"
    } = $props();

    let rgb = $state([
        1, 1, 1
    ])

    // transform the PsychoPy RGB values (-1:1) into CSS RGB (0:255) for the preview
    let preview = $derived(
        rgb.map(val => (val + 1) * 255 / 2)
    )
    
    $effect(() => {
        value = target === "param" ? `$[${rgb.join(", ")}]` : `[${rgb.join(", ")}]`
    })
</script>

<div class=page>
    <div class=ctrls>
        <!-- red -->
        <div class=ctrl>
            <div class=label>{translate("Red")}</div>
            <input 
                type=number 
                bind:value={rgb[0]}
                min={-1}
                max=1
                step=0.05
            />
        </div>
        <!-- green -->
        <div class=ctrl>
            <div class=label>{translate("Green")}</div>
            <input 
                type=number 
                bind:value={rgb[1]}
                min={-1}
                max=1
                step=0.05
            />
        </div>
        <!-- blue -->
        <div class=ctrl>
            <div class=label>{translate("Blue")}</div>
            <input 
                type=number 
                bind:value={rgb[2]}
                min={-1}
                max=1
                step=0.05
            />
        </div>
    </div>
    <div 
        class=preview
        style:background-color=rgba({preview})
    ></div>
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
    }
</style>