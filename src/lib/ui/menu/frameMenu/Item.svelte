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
         * @prop @type {String} Role of the button (e.g. copy, paste, save, etc.). Used to look up
         * the keyboard shortcut (if any) from prefs, and passed to Electron as the item's role if
         * no `onclick` is given (as Electron's built-in roles override any click callback).
         */
        role=undefined,
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
        /** @prop @type {boolean} Is this item able to be clicked on? */
        disabled=$bindable(),
        /** @slot Render an optional submenu on this item */
        submenu=undefined
    } = $props()

    // generate a unique ID which electron will use to call this button's method
    let id = $props.id()

    // get an Electron-friendly object representing this menu item
    function getProfile() {
        // start off with the basics
        let profile = {
            label: $state.snapshot(label),
            enabled: !$state.snapshot(disabled),
            click: id,
            // add role and accellerator if given
            role: (role && !onclick) ? $state.snapshot(role) : undefined,
            accelerator: (role && role in prefs.shortcuts) ? prefs.shortcuts[role].val.join("+") : undefined,
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
        shortcut={role}
        onclick={onclick ?? (() => {})}
        data={data}
        close={close}
        bind:disabled={disabled}
        submenu={submenu}
    />
{/if}
