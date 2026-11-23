<script>
    import { setContext } from 'svelte';
    import { PlaceholderPage } from '$lib/ui/placeholder';

    let {
        /** @prop @type {function} Function to execute when the page is changed */
        onselect=(index, data) => {},
        /** @prop {Snippet|string} [placeholder] Content to be rendered in the placeholder page */
        placeholder=undefined,
        /** @prop {Snippet} children Child elements are presumed to be tabs */
        children=undefined,
        /** @prop {ComponentProperties} props Other properties are passed through to the main div */
        ...props
    } = $props()

    let pages = $state({
        selected: {
            index: undefined,
            data: undefined,
            page: undefined
        },
        book: "notebook",
        all: [],
    })

    setContext("siblings", pages)
    $effect(() => {
        onselect(pages.selected.index, pages.selected.data)
    })
    // if no page is selected, select the one marked `initial` (this runs after all pages' own
    // effects, so any page which starts out selected will have claimed selection already)
    $effect(() => {
        if (pages.selected.index === undefined) {
            pages.all.find(page => page?.initial)?.select()
        }
    })
</script>

<div 
    class=notebook
    {...props}
>
    <div 
        class=notebook-tabs
        role=tablist
    >
        {@render children?.()}
    </div>
    <div 
        class=notebook-page
        role=tabpanel
    >
        {#if pages.selected.index === undefined}
            <PlaceholderPage 
                content={placeholder}
            />
        {:else}
            {@render pages.selected.page?.()}
        {/if}
    </div>
</div>

<style>
    .notebook {
        display: grid;
        grid-template-rows: [tabs] min-content [page] minmax(0, 1fr);
        gap: 0;
        justify-items: start;
        align-items: stretch;
        flex-grow: 1;
        min-height: 0;
        width: 100%;
    }

    .notebook-tabs {
        display: flex;
        flex-direction: row;
        flex-wrap: nowrap;
        overflow-y: hidden;
        overflow-x: auto;
        grid-row-start: tabs;
        margin-bottom: -1px;
        width: 100%;
    }

    .notebook-page {
        position: relative;
        display: flex;
        flex-direction: column;
        height: auto;
        overflow-y: auto;
        width: 100%;
        overflow-x: auto;
        padding: .5rem;
        box-sizing: border-box;
        background-color: var(--base);
        z-index: 1;
        border: 1px solid var(--overlay);
        grid-row-start: page;
    }
</style>