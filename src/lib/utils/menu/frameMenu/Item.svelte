<script>
    import { electron } from "$lib/globals.svelte";
    import { getContext } from "svelte";
    import { MenuItem } from "..";
    import { prefs } from "$lib/preferences.svelte";

    let {
        /** @prop @type {string} Label for this menu item */
        label,
        /** @prop @type {String|undefined} Path to an icon for this page's tab */
        icon=undefined,
        /** @prop @type {String} Name of the keyboard shortcut (if any) for this menu item */
        shortcut=undefined,
        /** @prop @type {String} Role of the button (e.g. copy, paste, etc.), mostly used for accelerators on Mac */
        role=undefined,
        /** 
         * @prop @type {function} Function to call when this item is clicked, given 3 params:
         * 
         * @param evt {MouseEvent} Event triggered on click
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
            click: id
        }
        // only assign a role if one is given
        if (role) {
            profile.role = $state.snapshot(role)
        }
        // assign an accellerator matching the shortcut
        if (shortcut && shortcut in prefs.shortcuts) {
            profile.accelerator = prefs.shortcuts[shortcut].val.join("+")
        }

        return profile
    }

    
    // add self to template
    let template = getContext("template");
    template.push(
        getProfile()
    )
    // take note of the index at which self was added
    let index = template.length - 1
    // listen for calls from backend
    electron.windows.listen(`menu:${id}`, evt => {
        // execute front-end onclick function
        onclick(evt, data)
    })
    // keep the template up to date as this item's values change
    $effect(() => Object.assign(
        template[index] || {}, 
        getProfile()
    ))
</script>

{#if onclick && !electron}
    <MenuItem
        label={label}
        icon={icon}
        shortcut={shortcut}
        onclick={onclick}
        data={data}
        close={close}
        bind:disabled={disabled}
        submenu={submenu}
    />
{/if}
