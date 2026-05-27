<script>
    import { onMount, onDestroy, getContext } from 'svelte';
    import Tooltip from '$lib/utils/tooltip/Tooltip.svelte';
    import Menu from '$lib/utils/menu/Menu.svelte';
    import { Icon } from "$lib/utils/icons";

    let {
        /** @prop @type {String} Label for this page's tab */
        label=$bindable(),
        /** @prop @type {String|undefined} Path to an icon for this page's tab */
        icon=undefined,
        /** @binding Control whether this page is selected */
        selected=$bindable(),
        /** @prop @type {boolean} Whetehr this tab should be highlighted */
        highlight=false,
        /** @prop @type {function|undefined} Function to close the tab (setting this will show the 
         * close button) */
        close=undefined,
        /** @prop @type {string|undefined} Tooltip when hovered over close button */
        closeTooltip=undefined,
        /** @prop @type {any} Arbitrary data relating to this page */
        data={},
        /** @interface @type {Array<HTMLElement>} Contents of this page */
        children=undefined,
        /** @interface @type {Array<HTMLElement>} Menu with which to replace the default context menu on this tab */
        contextMenu=undefined
    } = $props()

    // get context
    let siblings = getContext("siblings")
    // get own handle
    let handle;

    
    $effect(() => {
        // if siblings not initialised yet, do nothing
        if (siblings.selected === undefined) {
            return
        }
        // show self if no page is shown
        if (siblings.selected.index === undefined) {
            selected = true;
            siblings.selected.index = handle;
        }
        // update parent on selection
        if (selected) {
            siblings.selected.data = data;
            siblings.selected.page = children;
        }
    })
    
    // register self with notebook on mount
    onMount(() => {
        siblings.all.push(handle)
    })
    // unregister on destroy
    onDestroy(() => {
        if (siblings.all[siblings.all.indexOf(handle)] !== undefined) {
            delete siblings.all[siblings.all.indexOf(handle)]
        }
    })

    let closeHovered = $state.raw(false)

    let contextMenuParams = $state({
        pos: {
            x: undefined,
            y: undefined
        },
        show: false
    })

    let renaming = $state.raw(false)

</script>

<!-- tab button for this page -->
<Menu
    bind:shown={contextMenuParams.show}
    bind:position={contextMenuParams.pos}
>
    {@render contextMenu?.()}
</Menu>

<button
    class="notebook-tab"
    class:current={selected}
    class:listbook={siblings.book === "listbook"}
    class:notebook={siblings.book === "notebook"}
    onclick={evt => selected = true}
    oncontextmenu={(evt) => {
        evt.preventDefault();
        contextMenuParams.pos.x = evt.pageX;
        contextMenuParams.pos.y = evt.pageY;
        contextMenuParams.show = true;
    }}
    ondblclick={(evt) => renaming = true}
    ondragover={() => selected = true}
    bind:this={handle}
>
    {#if icon}
        <Icon 
            src={icon}
        />
    {/if}
    {#if renaming}
        <input 
            class=label 
            bind:value={label} 
            onkeydown={(evt) => {
                if (["Enter", "Escape"].includes(evt.key)) {
                    renaming = false
                }
            }}
            onfocusout={(evt) => renaming = false}
        />
    {:else}
        <span class=label class:highlight={highlight}>
            {label}
        </span>
    {/if}
    {#if close !== undefined}
        <div
            class=close-btn
            role=none
            onclick={(evt) => {
                // do close method
                close(evt);
                // select default tab
                siblings.selected.index = undefined;
            }}
            onmouseenter={() => {closeHovered = true}}
            onmouseleave={() => {closeHovered = false}}
            onfocusin={() => {closeHovered = true}}
            onfocusout={() => {closeHovered = false}}
        >
            <Icon 
                src="/icons/sym-close.svg"
                size=.75rem
            />
            {#if closeTooltip}
                <Tooltip
                    bind:shown={closeHovered}
                    position="bottom"
                >
                    {closeTooltip}
                </Tooltip>
            {/if}
        </div>
    {/if}
</button>

<style>
    .notebook-tab {
        display: grid;
        position: relative;
        grid-template-columns: [icon] min-content [label] 1fr [close] min-content;
        justify-items: center;
        border: none;
        border-radius: 0;
        padding: 0 .5rem;
        margin: 0;
        transition: background .2s;
    }
    .notebook-tab .label {
        grid-column-start: label;
        text-wrap: nowrap;
        padding: .5rem;
    }
    .notebook-tab .label.highlight {
        font-weight: bold;
    }
    .notebook-tab .close-btn {
        position: relative;
        color: var(--outline);
        opacity: 0.5;
        padding: .5rem;
        grid-column-start: close;
        z-index: 2;
    }
    .notebook-tab .close-btn:hover {
        opacity: 1;
        color: var(--red);
    }
    .notebook-tab.notebook {
        grid-row-start: tabs;
        text-align: center;
        background: var(--crust) linear-gradient(transparent 0%, transparent 75%, rgba(0, 0, 0, 0.025) 100%);
    }
    .notebook-tab.listbook {
        grid-column-start: tabs;
        text-align: left;
        padding: .5rem 1rem;
        background: var(--crust) linear-gradient(90deg, transparent 0%, transparent 75%, rgba(0, 0, 0, 0.025) 100%);
    }
    .notebook-tab.current {
        border-bottom: none;
        background: var(--base);
        z-index: 2;
        border: 1px solid var(--overlay);
    }
    .notebook-tab.notebook.current {
        border-bottom: none;
        margin-bottom: -1px;
    }
    .notebook-tab.listbook.current {
        border-right: none;
        margin-right: -1px;
    }
    .notebook-tab:hover {
        background-color: var(--mantle);
        background: var(--mantle) linear-gradient(transparent 0%, transparent 75%, rgba(0, 0, 0, 0.01) 100%);
    }
</style>