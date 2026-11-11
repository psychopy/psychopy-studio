<script>
    import { getContext } from "svelte";
    import { Icon } from "$lib/ui/icon";
    import { prefs } from "$lib/preferences.svelte";

    let {
        /** @prop @type {string} Label for this menu item */
        label,
        /** @prop @type {String|undefined} Path to an icon for this page's tab */
        icon=undefined,
        /**
         * @prop @type {String|undefined} Name of the action (e.g. save, undo, etc.) this item
         * performs. Clicking runs the view's callback for this action (if any) as well as
         * `onclick`, and the keyboard shortcut of the same name (if any) is shown.
         */
        action=undefined,
        /** * @prop @type {function} Function to call when this item is clicked, given 3 params:
         * * @param evt {MouseEvent} Event triggered on click
         * @param data {any} Arbitrary data associated with this menu item
         */
        onclick=undefined,
        /** @prop @type {any} Arbitrary data associated with this menu item  */
        data={},
        /** @prop @type {boolean} Close menu on click? */
        close=true,
        /** @prop @type {boolean|undefined} Is this item unable to be clicked on? (if undefined, follows the callback for `action`, if any) */
        disabled=$bindable(),
        /** @slot Render an optional submenu on this item */
        submenu=undefined,
        /** Catch-all for hover events and other attributes */
        ...rest
    } = $props()

    // function to close parent
    let closeMenu = getContext("closeMenu");

    // get the callback (if any) for this item's action
    let callbacks = getContext("callbacks") ?? {};
    let callback = $derived(action ? callbacks[action] : undefined);
    // use the given disabled state if set, otherwise the action's callback (if any)
    let isDisabled = $derived(disabled ?? callback?.disabled ?? false)

    // define some key labels
    let keyLabels = {
        CONTROL: "CTRL",
        META: "CMD"
    }
</script>


<button  
    class=menu-item
    data-action={action}
    {...rest}
    onclick={(evt) => {
        // execute the callback for this item's action (unless disabled)
        if (callback && !callback.disabled) {
            callback.fcn()
        }
        // execute the given function, with arbitrary data given on init
        onclick?.(evt, data);
        // close menu if requested
        if (close) {
            closeMenu()
        }
    }}
    disabled={isDisabled}
>
    <Icon 
        src={icon}
        size=1rem
    />
    <span class=label>
        {label}
    </span>
    <span class=shortcut>
        {#if action in prefs.shortcuts}
            {prefs.shortcuts[action].val.map(
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