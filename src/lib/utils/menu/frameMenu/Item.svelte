<script>
    import { electron } from "$lib/globals.svelte";
    import { getContext } from "svelte";
    import { MenuItem } from "..";

    let {
        /** @prop @type {string} Label for this menu item */
        label,
        /** @prop @type {String|undefined} Path to an icon for this page's tab */
        icon=undefined,
        /** @prop @type {String} Name of the keyboard shortcut (if any) for this menu item */
        shortcut=undefined,
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

    // generate a uniq ID which electron will use to call this button's method
    let id = $props.id()
    // add self to template
    let template = getContext("template");
    template.push({
        label: label,
        enabled: !disabled,
        click: id
    })
    let index = template.length - 1
    // listen for calls from backend
    electron.windows.listen(`menu:${id}`, evt => {
        onclick(evt, data)
    })

    $effect(() => Object.assign(template[index] || {}, {
        label: label,
        enabled: !disabled,
        click: id
    }))
</script>

{#if !electron}
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
