<script>
    import Icon from "$lib/utils/icons/Icon.svelte";
    import Tooltip from "$lib/utils/tooltip/Tooltip.svelte";

    let {
        /** @prop @type {string|undefined} Path to icon for this button, if any */
        icon = undefined,
        /** @prop @type {(evt: PointerEvent) => undefined} Function to call when this button is pressed */
        onclick,
        /** @prop @type {string|undefined} Hover text for this button, if any */
        tooltip = undefined,
        /** Are we awaiting execution of this button? */
        awaiting=$bindable(false),
        /** @prop @type {boolean} Disable this button */
        disabled = false
    } = $props()

    let showTooltip = $state(false)
</script>

<button
    onclick={onclick}
    disabled={disabled}
    onmouseenter={() => {showTooltip = true}}
    onmouseleave={() => {showTooltip = false}}
    onfocusin={() => {showTooltip = true}}
    onfocusout={() => {showTooltip = false}}
    style:z-index={showTooltip ? 10 : "inherit"}
    aria-label={tooltip}
>
    {#if tooltip}
        <Tooltip
            bind:shown={showTooltip}
            position="bottom-right"
        >
            {tooltip}
        </Tooltip>
    {/if}
    {#if icon}
        <Icon 
            src={icon} 
            size=1.25rem
            bind:awaiting={awaiting}
        />
    {/if}
</button>

<style>
    button {
        position: relative;
        align-items: center;
        padding: .25em .5rem;
        font-family: var(--body);
        background-color: transparent;
        border: 1px solid var(--overlay);
        border-radius: .5rem;
        transition: border-color .2s, box-shadow .2s, background-color .2s, color .2s;
        box-shadow: 
            inset -1px -1px 2px rgba(0, 0, 0, 0.025)
        ;

        display: grid;
        align-items: center;
        justify-content: center;
    }

    button:disabled {
        opacity: 50%;
    }
    button:enabled:hover,
    button:enabled:focus {
        outline: none;
        border-color: var(--blue);
        box-shadow: 
            inset 1px 1px 10px rgba(0, 0, 0, 0.05)
        ;
    }    
</style>
