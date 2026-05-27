<script>
    import { electron } from "$lib/globals.svelte";
    import { getContext, setContext } from "svelte";
    import { SubMenu } from "..";

    let {
        /** @prop @type {string} Label for this menu item */
        label,
        /** @prop @type {String|undefined} Path to an icon for this page's tab */
        icon=undefined,
        /** @prop @type {any} Arbitrary data associated with this menu item  */
        data={},
        /** @prop @type {boolean} Is this item able to be clicked on? */
        disabled=$bindable(),
        children
    } = $props()

    // add self to template
    let template = getContext("template");
    template.push({
        label: label,
        submenu: []
    })
    // set own submenu as new template
    setContext("template", template[template.length - 1].submenu)
</script>

{#if !electron}
    <SubMenu
        label={label}
        icon={icon}
        data={data}
        bind:disabled={disabled}
    >
        {@render children?.()}
    </SubMenu>
{:else}
    {@render children?.()}
{/if}

