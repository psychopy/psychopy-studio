<script>
    import { getContext, onMount } from "svelte";
    import { AttachedButton, RadioButton } from "$lib/ui/button";
    import { translate } from "$lib/translation";

    let {
        /** @prop @type {Snippet|string} Either a snippet containing the inner contents of this item's button in the list panel, or a string to use for its label */
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
        <RadioButton
            bind:selection={siblings.selected}
            value={index}
            label={label}
            id="{index}-tab"
            role="tab"
            aria-selected={siblings.selected === index}
            aria-controls={siblings.selected === index ? `${index}-panel` : undefined}
            focusgroupstart={siblings.selected === index ? "" : undefined}
            large
            opaque
        />
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

