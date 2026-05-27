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
        book: "notebook",
        all: [],
    })

    setContext("siblings", pages)
    $effect(() => {
        onselect(pages.selected.index, pages.selected.data)
    })
</script>

<div 
    class=notebook
>
    <div class=notebook-tabs>
        {@render children?.()}
    </div>
    <div class=notebook-page>
        {#if pages.selected.index === undefined}
            <div class=placeholder-page>
                <svg>
                    <use href={"/branding/emblem-line.svg"} />
                </svg>
            </div>
        {:else}
            {@render pages.selected.page?.()}
        {/if}
    </div>
</div>

<style>
    .notebook {
        display: grid;
        grid-template-rows: [tabs] min-content [page] auto;
        gap: 0;
        justify-items: start;
        align-items: stretch;
        margin: auto;
        height: 100%;
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

    .placeholder-page {
        position: absolute;
        left: 0; right: 0; top: 0; bottom: 0;
        background-color: var(--crust);
        color: var(--outline);
        overflow: hidden;
    }

    .placeholder-page svg {
        opacity: 10%;
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
</style>