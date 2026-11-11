<script>
    import { electron } from "$lib/globals.svelte";
    import { MenuItem } from "..";
    import { addToTemplate, removeFromTemplate } from "./utils";
    import { prefs } from "$lib/preferences.svelte";
    import { getContext, onMount } from "svelte";

    let {
        /** @prop @type {string} Label for this menu item */
        label,
        /** @prop @type {String|undefined} Path to an icon for this page's tab */
        icon=undefined,
        /**
         * @prop @type {String|undefined} Name of the action (e.g. copy, paste, save, etc.) this 
         * item performs. Clicking runs the view's callback for this action (if any) as well as 
         * `onclick`, and the keyboard shortcut of the same name (if any) is used as the 
         * accelerator. If there's nothing to run (no `onclick`, and no callback or the callback is 
         * disabled), it's passed to Electron as the item's role, so Electron's built-in actions 
         * (cut, paste, zoomIn, etc.) can be used. Electron's built-in roles override any click 
         * callback, so this is the only case where they're passed.
         */
        action=undefined,
        /**
         * @prop @type {function} Function to call when this item is clicked, given 3 params:
         *
         * @param evt {MouseEvent} Event triggered on click
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
        submenu=undefined
    } = $props()

    // generate a unique ID which electron will use to call this button's method
    let id = $props.id()

    // get the callback (if any) for this item's action
    let callbacks = getContext("callbacks") ?? {}
    let callback = $derived(action ? callbacks[action] : undefined)
    // use the given disabled state if set, otherwise the action's callback (if any)
    let isDisabled = $derived(disabled ?? callback?.disabled ?? false)
    // is there anything to run on click?
    let clickable = $derived(onclick !== undefined || (callback !== undefined && !callback.disabled))

    // get an Electron-friendly object representing this menu item
    function getProfile() {
        // start off with the basics
        let profile = {
            label: $state.snapshot(label),
            enabled: !isDisabled,
            click: id,
            // use action as Electron role if there's nothing to run on click
            role: (action && !clickable) ? $state.snapshot(action) : undefined,
            // use the action's shortcut as accelerator
            accelerator: (action && action in prefs.shortcuts) ? prefs.shortcuts[action].val.join("+") : undefined,
        }

        return profile
    }

    // get template
    let template = getContext("template");
    // construct template entry for this item
    let entry = $state(getProfile())
    // add self to template on mount, and remove on unmount
    onMount(() => {
        addToTemplate(template, entry)

        return () => removeFromTemplate(template, entry)
    })
    // listen for calls from backend
    electron.windows.listen(`menu:${id}`, evt => {
        // execute the callback for this item's action (unless disabled)
        if (callback && !callback.disabled) {
            callback.fcn()
        }
        // execute front-end onclick function
        onclick?.(evt, data)
    })
    // keep the template up to date as this item's values change
    $effect(() => Object.assign(
        entry,
        getProfile()
    ))
</script>

{#if !electron}
    <MenuItem
        label={label}
        icon={icon}
        action={action}
        onclick={onclick}
        data={data}
        close={close}
        disabled={disabled}
        submenu={submenu}
    />
{/if}
