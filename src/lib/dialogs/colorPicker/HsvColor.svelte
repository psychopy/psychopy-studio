<script>
    import { translate } from "$lib/translation";

    let {
        value=$bindable(),
        target="param"
    } = $props();

    let hsv = $state([
        0, 1, .5
    ])
    
    $effect(() => {
        value = target === "param" ? `$[${hsv.join(", ")}]` : `[${hsv.join(", ")}]`
    })
</script>

<div class=page>
    <div class=ctrls>
        <!-- hue -->
        <div class=ctrl>
            <div class=label>{translate("Hue")}</div>
            <input 
                type=number 
                bind:value={hsv[0]}
                min=0
                max=360
            />
        </div>
        <!-- saturation -->
        <div class=ctrl>
            <div class=label>{translate("Saturation")}</div>
            <input 
                type=number 
                bind:value={hsv[1]}
                min=0
                max=100
            />
        </div>
        <!-- luminance -->
        <div class=ctrl>
            <div class=label>{translate("Value")}</div>
            <input 
                type=number 
                bind:value={hsv[2]}
                min=0
                max=100
            />
        </div>
    </div>
    <div 
        class=preview
        style:background-color="hsl({hsv[0]}, {hsv[1]*100}%, {hsv[2]*100}%)"
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