<script>
    import Tooltip from "$lib/utils/tooltip/Tooltip.svelte";

    let {
        /** @prop @type {string} Text label for this button, if any */
        labels=["", ""],
        /** @prop @type {string|undefined} Hover text for this button, if any */
        tooltip=undefined,
        /** @prop @type {string} Starting  */
        value=$bindable(),
        /** @prop @type {function} Function to call when this switch is toggled */
        onclick=() => {},
        /** @prop @type {boolean} Disable this button */
        disabled=false
    } = $props()

    let showTooltip = $state.raw(false)
</script>

<button 
    class="switch-ctrl" 
    onclick={(evt) => {
        value = !value;
        onclick(evt)
    }}
    onmouseenter={() => showTooltip = true}
    onmouseleave={() => showTooltip = false}
    onfocusin={() => showTooltip = true}
    onfocusout={() => showTooltip = false}
    disabled={disabled}
>
    {#if tooltip}
        <Tooltip
            position=bottom
            bind:shown={showTooltip}
        >
            {tooltip}
        </Tooltip>
    {/if}
    <div class="label left {value ? "inactive" : "active"}">{labels[0]}</div>
    <div 
        class=indicator 
        style:left={value ? "calc(50% - .25rem)" : ".25rem"}
        style:right={value ? ".25rem" : "calc(50% - .25rem)"}
        class:left={value} 
        class:right={!value}
    ></div>
    <div class="label right {value ? "active" : "inactive"}">{labels[1]}</div>
</button>

<style>
    .indicator {
        position: absolute;
        top: .25rem; bottom: .25rem;
        z-index: -1;
        background-color: var(--blue);
        transition: left .5s, right .5s;
        border-radius: 2rem;
        border: 1px solid var(--blue);
    }

    .label {
        margin: 0 1rem;
        transition: color 1s;
    }
    .label.active {
        color: var(--text-on-blue);
    }

    button.switch-ctrl  {
        display: grid;
        position: relative;
        padding: 0 .25rem;
        align-content: center;
        align-items: center;
        justify-content: center;
        justify-items: center;
        grid-template-columns: 50% 50%;
        background-color: transparent;
        border-radius: 2rem;
        z-index: 0;
        border: 1px solid var(--overlay);
    }
    button.switch-ctrl:disabled {
        opacity: .5;
    }

    button.switch-ctrl:hover,
    button.switch-ctrl:focus {
        box-shadow: inset 1px 1px 10px rgba(0, 0, 0, 0.05);
    }
    button.switch-ctrl:focus {
        border-color: var(--blue);
    }

    button.switch-ctrl:hover .indicator,
    button.switch-ctrl:focus .indicator {
        box-shadow: inset 1px 1px 10px rgba(0, 0, 0, 0.1);
        border-color: var(--outline);
    }

</style>