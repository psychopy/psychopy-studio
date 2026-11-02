<script>
    import { marked } from "marked";
    import { getContext, onMount } from "svelte";
    import { AttachedButton } from "$lib/ui/button";
    import { translate } from "$lib/translation";

    let {
        /** @prop @type {Snippet|string} Either a snippet containing the inner contents of this item's button in the list panel, or a string (Markdown) to use for its label */
        label,
        /** @prop @type {*} Arbitrary data associated with this item, used for searching */
        data={},
        /** @prop @type {boolean} Boolean showing whether this item is selected; setting it will select the item */
        selected=$bindable(),
        /** @prop @type {function|undefined} Function to remove this item (setting this will show the remove button) */
        onremove=undefined,
        /** @prop @type {string|undefined} Tooltip when hovered over remove button */
        removeTooltip=undefined,
        /** @prop @type {array<Snippet>} Children of this element are presumed to be the contents of details */
        children
    } = $props()

    // use Svelte's unique ID to identify this item
    let index = $props.id()
    // get sibling items
    let siblings = getContext("siblings")
    // get category
    let categ = getContext("categ")

    onMount(() => {
        // create an entry to put in siblings array
        let item = {
            index: index,
            categ: categ,
            get data() { return data },
            button: itemButton,
            details: itemDetails,
            shown: true
        }
        // append it
        siblings.items.push(item)
        // remove on unmount
        return () => {
            // get index of this item
            let i = siblings.items.findIndex(sibling => sibling.index === index)
            // remove it by index
            if (i >= 0) {
                siblings.items.splice(i, 1)
            }
            // if selected, clear selection
            if (siblings.selected === index) {
                siblings.selected = undefined
            }
        }
    })

    // when selected changes, update siblings.selected
    $effect(() => {
        if (selected) {
            siblings.selected = index
        }
    })
    // if siblings.selected is set to this item's index, update selected
    $effect(() => {
        selected = siblings.selected === index
    })
</script>

{#snippet itemButton()}
    <AttachedButton
        icon="/icons/sym-close.svg"
        onclick={onremove}
        tooltip={removeTooltip || translate("Remove")}
        shortcut="Delete"
        negative
    >
        <button 
            id="{index}-tab"
            class=item-button
            class:selected={siblings.selected === index}
            role="tab"
            aria-selected={siblings.selected === index}
            aria-controls={siblings.selected === index ? `${index}-panel` : undefined}
            focusgroupstart={siblings.selected === index ? "" : undefined}
            onclick={evt => siblings.selected = index}
        >
            {#if typeof label === "function"}
                {@render label()}
            {:else if typeof label === "string" && label.includes("\n")}
                {@html marked(label)}
            {:else if typeof label === "string"}
                {@html marked.parseInline(label)}
            {:else}
                {label}
            {/if}
        </button>
    </AttachedButton>
{/snippet}

{#snippet itemDetails()}
    {#if siblings.selected === index}
        <div
            id="{index}-panel"
            class=item-details
            role="tabpanel"
            aria-labelledby="{index}-tab"
            tabindex=0
        >
            {@render children?.()}
        </div>
    {/if}
{/snippet}

<style>
    .item-button {
        display: flex;
        flex-direction: column;
        text-align: left;
        background-color: var(--base);
        border: 1px solid var(--overlay);
        border-radius: .5rem;
        padding: 1rem;
        transition: border-color .2s, box-shadow .2s, background-color .2s, color .2s;
        box-shadow: 
            inset -1px -1px 2px rgba(0, 0, 0, 0.025)
        ;
    }
    .item-button:disabled {
        opacity: 50%;
    }
    .item-button:hover,
    .item-button:focus {
        outline: none;
        border-color: var(--blue);
        box-shadow: 
            inset 1px 1px 10px rgba(0, 0, 0, 0.05)
        ;
    }
    .item-button.selected {
        border-color: var(--blue);
        box-shadow: 
            inset 1px 1px 10px rgba(0, 0, 0, 0.05)
        ;
    }
</style>