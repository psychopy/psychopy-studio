<script>
    import Menu from "./Menu.svelte";
    import Item from "./Item.svelte";
    import { Icon } from "$lib/utils/icons";

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

    let shown = $state()
</script>

<Item 
    label={label} 
    icon={icon} 
    onmouseenter={() => shown = true}
    onmouseleave={() => shown = false}
    onclick={() => {
        shown = true
    }}
    data={data}
    close={false}
    disabled={disabled}
>

    {#snippet submenu()}
        <Icon 
            src="/icons/sym-arrow-right.svg"
            size=".5rem"
        />
        <Menu 
            bind:shown={shown}
        >
            <div class=menu>
                {@render children()}
            </div>
        </Menu>
    {/snippet}
</Item>


<style>
    .menu {
        display: flex;
        flex-direction: column;
    }
</style>