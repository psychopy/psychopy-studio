<script>
    import { translate } from "$lib/translation";

    let {
        value=$bindable(),
        target="param"
    } = $props();

    let rgb = $state([
        255, 255, 255
    ])
    
    $effect(() => {
        value = target === "param" ? `#${new Uint8Array(rgb).toHex()}` : `"#${new Uint8Array(rgb).toHex()}"`
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
                min=0
                max=255
            />
            <code class=output>
                = {new Uint8Array([rgb[0]]).toHex()}
            </code>
        </div>
        <!-- green -->
        <div class=ctrl>
            <div class=label>{translate("Green")}</div>
            <input 
                type=number 
                bind:value={rgb[1]}
                min=0
                max=255
            />
            <code class=output>
                = {new Uint8Array([rgb[1]]).toHex()}
            </code>
        </div>
        <!-- blue -->
        <div class=ctrl>
            <div class=label>{translate("Blue")}</div>
            <input 
                type=number 
                bind:value={rgb[2]}
                min=0
                max=255
            />
            <code class=output>
                = {new Uint8Array([rgb[2]]).toHex()}
            </code>
        </div>
    </div>
    <div 
        class=preview
        style:background-color={value}
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