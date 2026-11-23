<script>
    import { setContext } from 'svelte';

    let {
        /** @prop @type {function} Function to execute when the page is changed */
        onselect=(index, data) => {},
        /** @interface @type {Array<HTMLElement>} Child elements of this notebook */
        children=undefined
    } = $props()

    let pages = $state({
        selected: {
            index: undefined,
            data: undefined,
            page: undefined
        },
        book: "listbook",
        all: [],
    })

    setContext("siblings", pages)
    $effect(() => {
        onselect(pages.selected.index, pages.selected.data)
    })
    // if no page is selected, select the one marked `initial`, or the first one if none are (this 
    // runs after all pages' own effects, so any page which starts out selected will have claimed 
    // selection already)
    $effect(() => {
        if (pages.selected.index === undefined) {
            (
                pages.all.find(page => page?.initial) 
                ?? pages.all.find(page => page !== undefined)
            )?.select()
        }
    })

</script>
<div 
    class=listbook
>
    <div 
        class=listbook-tabs
        role=tablist
    >
        {@render children?.()}
    </div>
    <div 
        class=listbook-page
        role=tabpanel
    >
        {@render pages.selected.page?.()}
    </div>
</div>

<style>
    .listbook {
        display: grid;
        grid-template-columns: [tabs] min-content [page] auto;
        grid-template-rows: minmax(0, 1fr);
        gap: 0;
        justify-items: stretch;
        align-items: start;
        flex-grow: 1;
        min-height: 0;
    }

    .listbook-tabs {
        display: flex;
        flex-direction: column;
        flex-wrap: nowrap;
        overflow-x: hidden;
        overflow-y: auto;
        grid-column-start: tabs;
        margin-right: -1px;
        height: 100%;
    }

    .listbook-page {
        position: relative;
        display: flex;
        flex-direction: column;
        height: auto;
        overflow-y: auto;
        height: 100%;
        overflow-x: auto;
        padding: .5rem;
        box-sizing: border-box;
        background-color: var(--base);
        z-index: 1;
        border: 1px solid var(--overlay);
        grid-column-start: page;
    }
</style>