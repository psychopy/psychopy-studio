<script>
    import { getContext } from "svelte";
    import { Icon } from "$lib/utils/icons";
    import { prefs } from "$lib/preferences.svelte";

    let {
        /** @prop @type {string} Label for this menu item */
        label,
        /** @prop @type {String|undefined} Path to an icon for this page's tab */
        icon=undefined,
        /** @prop @type {String} Name of the keyboard shortcut (if any) for this menu item */
        shortcut=undefined,
        /** * @prop @type {function} Function to call when this item is clicked, given 3 params:
         * * @param evt {MouseEvent} Event triggered on click
         * @param data {any} Arbitrary data associated with this menu item 
         */
        onclick=(evt, data) => {},
        /** @prop @type {any} Arbitrary data associated with this menu item  */
        data={},
        /** @prop @type {boolean} Close menu on click? */
        close=true,
        /** @prop @type {boolean} Is this item able to be clicked on? */
        disabled=$bindable(),
        /** @slot Render an optional submenu on this item */
        submenu=undefined,
        /** Catch-all for hover events and other attributes */
        ...rest
    } = $props()

    // function to close parent
    let closeMenu = getContext("closeMenu");

    // define some key labels
    let keyLabels = {
        CONTROL: "CTRL",
        META: "CMD"
    }
</script>


<button  
    class=menu-item 
    {...rest}
    onclick={(evt) => {
        // execute the given function, with arbitrary data given on init
        onclick(evt, data);
        // close menu if requested
        if (close) {
            closeMenu()
        }
    }}
    disabled={disabled}
>
    <Icon 
        src={icon}
        size=1rem
    />
    <span class=label>
        {label}
    </span>
    <span class=shortcut>
        {#if shortcut in prefs.shortcuts}
            {prefs.shortcuts[shortcut].val.map(
                item => keyLabels[item] || item
            ).join("+")}
        {/if}
    </span>
    {@render submenu?.()}
</button>

<style>
    .menu-item {
        /* position within menu */
        grid-column-start: items;
        /* own attributes */
        display: grid;
        position: relative;
        grid-template-columns: [icon] 1rem [label] 1fr [shortcut] max-content [chevron] 1rem;
        align-items: center;
        justify-items: start;
        gap: 0 .5rem;
        width: 100%;
        white-space: nowrap;
        margin: 0;
        background-color: transparent;
        border: none;
        border-radius: 0;
        padding: 0.75rem 1rem;
        transition: background-color .2s;
    }
    .menu-item .label {
        grid-column-start: label;
    }
    .menu-item .shortcut {
        grid-column-start: shortcut;
        font-family: var(--mono);
        color: var(--outline);
        font-size: .9em;
        padding-left: 4rem;
    }
    .menu-item:enabled:hover,
    .menu-item:enabled:focus {
        background-color: var(--mantle);
    }
    .menu-item:enabled:focus {
        border: 1px solid var(--blue);
    }

    .menu-item:disabled {
        opacity: 50%;
    }

</style>