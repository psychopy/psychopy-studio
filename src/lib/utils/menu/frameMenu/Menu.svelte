<script>
    import { electron } from "$lib/globals.svelte";
    import { onMount, setContext } from "svelte";
    import { Menu } from "..";
    import { RibbonSection } from '$lib/utils/ribbon';
    import { IconButton } from '$lib/utils/buttons';
    import { translate } from "$lib/translation";

    let {
        /** @public @type {import("svelte").store<boolean|undefined>} Whether this menu is shown */
        shown=$bindable(),
        position=$bindable({
            x: undefined,
            y: undefined
        }),
        children=undefined
    } = $props()

    let template = $state([])
    setContext("template", template);
    if (electron) {
        $effect(() => {
            // take snapshot of template state
            let templateSnapshot = $state.snapshot(template);
            // create function to update menu
            let updateMenu = async () => {
                await electron.windows.setMenu(
                    templateSnapshot
                )
            }
            // call it (but don't await, as this would break $effect)
            updateMenu()
        })
    }

</script>

{#if !electron}
    <RibbonSection>
        <IconButton 
            icon="/icons/btn-hamburger.svg"
            label={translate("Menu")}
            onclick={() => shown = true} 
            borderless
        />
        <Menu 
            bind:shown={shown}
            bind:position={position}
            children={children}
        >
            {@render children?.()}
        </Menu>
    </RibbonSection>
{:else}
    {@render children?.()}
{/if}


