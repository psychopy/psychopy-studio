<script>
    import Menu from "$lib/utils/menu/Menu.svelte";
    import Icon from "$lib/utils/icons/Icon.svelte";
    import Tooltip from "$lib/utils/tooltip/Tooltip.svelte";

    let {
        /** @prop @type {string} Label for this button */
        label,
        /** @prop @type {string|undefined} Path to icon for this button, if any */
        icon = undefined,
        /** @prop @type {(evt: PointerEvent) => undefined} Function to call when this button is pressed */
        onclick,
        /** @prop @type {string|undefined} Hover text for this button, if any */
        tooltip = undefined,
        /** Are we awaiting execution of this button? */
        awaiting=$bindable(false),
        /** @prop @type {boolean} Disable this button */
        disabled = false,
        /** @interface Inner contents of menu to be shown when button is clicked */
        children=undefined
    } = $props()

    let showTooltip = $state(false)
    let showMenu = $state(false);
</script>

<div class=dropdown-button>
    <button
        class=action-btn
        onclick={onclick}
        disabled={disabled}
        onmouseenter={() => {showTooltip = true}}
        onmouseleave={() => {showTooltip = false}}
        onfocusin={() => {showTooltip = true}}
        onfocusout={() => {showTooltip = false}}
    >
        {#if icon}
            <div class=icon-container>
                <Icon 
                    src={icon}
                    size=2rem
                    bind:awaiting={awaiting}
                />
            </div>
        {/if}
        <span
            class=label
        >
            {#await awaiting}
                ...
            {:then}
                {label}
            {:catch err}
                {err}
            {/await}
        </span>
        {#if tooltip}
            <Tooltip
                bind:shown={showTooltip}
            >
                {tooltip}
            </Tooltip>
        {/if}
    </button>
    <button
        class=more-btn
        onclick={(evt) => showMenu = !showMenu}
        aria-label="v"
    >
        <div class=chevron>
            <Icon 
                src="/icons/sym-arrow-down.svg"
            />
        </div>
    </button>
    <Menu
        bind:shown={showMenu}
    >
        {@render children?.()}
    </Menu>
</div>

<style>
    button {
        position: relative;
        background-color: transparent;
        border: 1px solid var(--overlay);
        border-radius: .5rem;
        transition: border-color .2s, box-shadow .2s, background-color .2s, color .2s;
        box-shadow: 
            inset -1px -1px 2px rgba(0, 0, 0, 0.025)
        ;
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
    .dropdown-button {
        position: relative;
        display: flex;
        flex-direction: row;
        gap: 0;
    }

    button .icon-container {
        display: flex;
        align-items: center;
        margin: .6em 0;
        border-radius: .5rem;
        overflow: hidden;
    }

    button .label {
        grid-column-start: label;
    }

    .chevron {
        width: .5rem;
    }

    button:hover {
        z-index: 2;
    }

    .action-btn {
        border-top-right-radius: 0;
        border-bottom-right-radius: 0;
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: .75rem;
        padding: 0 .75em;
    }
    .more-btn {
        border-top-left-radius: 0;
        border-bottom-left-radius: 0;
        margin-left: -1px;
        padding: 0 .6rem;
    }
    
</style>