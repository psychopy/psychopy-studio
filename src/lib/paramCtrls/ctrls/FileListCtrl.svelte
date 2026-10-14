<script>
    import { Param } from "$lib/experiment";
    import { CompactButton } from "$lib/utils/buttons";
    import { sanitizeJSON } from "$lib/utils/transpiler"
    import FileCtrl from "./FileCtrl.svelte";
    import { mimeTypesFromParam } from "./utils.svelte";
    import { browseFileOpen } from "$lib/utils/files.js";
    import path from "path-browserify";
    import { translate } from "$lib/translation";
    import { getContext } from "svelte";

    let {
        param=$bindable(),
        /** @prop @type {boolean} Controls whether this control is disabled */
        disabled=false,
        /** @interface */
        ...attachments
    } = $props()

    let current = getContext("current");

    let entryPoints = $state([]);
    let dragging = $state.raw(undefined);
    let selected = $state({
        last: undefined,
        all: []
    });
    let editing = $state([]);
    
    // make sure param val is always a list rather than a string
    $effect(() => {
        if (typeof param.val === "string") {
            // sanitize value
            let value = sanitizeJSON(param.val)
            // parse JSON
            try {
                param.val = JSON.parse(value)
            } catch {
                console.warn(`Failed to parse '${value}' as JSON`)
                param.val = []
            }
        }
    })

    let items = $derived.by(() => {
        let items = []
        // make a param for each entry
        for (let [i, val] of Object.entries(param.val)) {
            let item = new Param(`${param.name}:${i}`)
            item.val = val;
            item.valType = "str"
            items.push(item)
            $effect(() => {
                param.val[i] = item.val;
            })
        }
        
        return items
    })

    function validateFileList(param, valid) {
        // combine valid on all child items
        valid.value = items.every(
            item => item.valid.value
        )
        // combine warnings from child items
        valid.warning = items.map(
            item => item.valid.warning
        ).join("\n")
    }

    /**
     * Apply the value of an item in this control to the param
     * 
     * @param i {number} Index of the item to apply
     */
    function apply(i) {
        // apply value
        param.val[i] = items[i].val;
        // mark no longer editing
        editing[i] = false;
    }

    /**
     * Apply all currently editing items
     */
    function applyAll() {
        // for items being edited...
        for (let i in editing) {
            if (editing[i]) {
                apply(i)
            }
        }
    }

    let handle = $state.raw()

</script>

{#snippet entryPoint(i)}
    <div 
        class=entry-point
        bind:this={entryPoints[i]}
        ondrop={evt => {
            // abort if not dragging
            if (dragging === undefined || !entryPoints.includes(evt.target)) {
                return
            }
            // get indices to move to and from
            let fromIndex = dragging;
            let toIndex = entryPoints.indexOf(evt.target)
            // get item to move
            let item = param.val[fromIndex]
            // if splice changes the indices, adjust
            if (toIndex > fromIndex) {
                toIndex -= 1;
            }
            // if toIndex was -1, move to end
            if (toIndex < 0) {
                toIndex = param.val.length;
            }
            // do splice
            param.val.splice(
                fromIndex, 
                1
            )
            param.val.splice(
                toIndex, 
                0, 
                item
            )
        }}
        role="none"
        style:z-index={dragging === undefined ? -1 : 1}
    >
    </div>
{/snippet}

<div 
    bind:this={handle}
    class=layout
    {@attach element => param.registerValidator("fileList", validateFileList, -5)}
    {...attachments}
>
    {#each Object.entries(items) as [i, item]}
        {@render entryPoint(i)}
        <div 
            class=item
        >
            {#if editing[i]}
                <FileCtrl
                    param={item}
                    disabled={disabled}
                />
                <CompactButton
                    icon="/icons/btn-tick.svg"
                    onclick={evt => apply(i)}
                    tooltip={translate("Accept")}
                    disabled={disabled}
                />
            {:else}
                <button
                    class:selected={selected.all[i]}
                    class:code={item.isCode}
                    onclick={evt => {
                        // different behaviour according to modifier keys
                        if (evt.shiftKey) {
                            if (selected.last === undefined) {
                                // if first selection, select and store last
                                selected.all[i] = true
                                selected.last = i
                            } else {
                                // if subsequent selection, select all inbetween
                                selected.all = []
                                let ii
                                for (ii = Math.min(i, selected.last); ii <= Math.max(i, selected.last); ++ii) {
                                    selected.all[ii] = true
                                }
                            }
                        } else if (evt.ctrlKey) {
                            // if ctrl, only toggle
                            selected.all[i] = !selected.all[i]
                        } else {
                            if (selected.all[i]) {
                                // if selected, deselect
                                selected.all = []
                                selected.last = undefined
                            } else {
                                // if not selected, select exclusively
                                let ii
                                for (ii = 0; ii < items.length; ++ii) {
                                    selected.all[ii] = ii === parseInt(i)
                                }
                                selected.last = i
                            }
                        }
                        // apply any items currently being edited
                        applyAll()
                    }}
                    ondblclick={evt => editing[i] = true}
                    draggable={true}
                    ondragstart={evt => dragging = i}
                    ondragend={evt => dragging = undefined}
                >
                    {item.val}
                </button>
                <CompactButton
                    icon="/icons/btn-edit.svg"
                    onclick={evt => editing[i] = true}
                    tooltip={translate("Edit")}
                    disabled={disabled}
                />
            {/if}
        </div>
    {/each}
    {@render entryPoint(items.length)}
    <div class=ctrls>
        <CompactButton 
            icon="/icons/btn-add-many.svg"
            onclick={async (evt) => {
                // do we have mime types from the param?
                let types = mimeTypesFromParam(param)
                // open file browser
                let files = await browseFileOpen(types, current.experiment?.file?.parent, true)
                // apply to param
                for (let file of files) {
                    // make relative
                    let rel = file.file
                    if (current.experiment?.file?.parent) {
                        rel = path.relative(current.experiment?.file?.parent, file.file)
                    }
                    // use absolute if in a different folder
                    if (rel.startsWith("..")) {
                        param.val.push(file.file)
                    } else {
                        param.val.push(rel)
                    }
                }
            }}
            tooltip={translate("Add multiple items")}
            disabled={disabled}
        />
        <CompactButton
            icon="/icons/btn-add.svg"
            onclick={(evt) => {
                // add item
                param.val.push("");
                // start off editing
                editing[param.val.length] = true;
            }}
            tooltip={translate("Add item")}
            disabled={disabled}
        />
        {#if selected.all.some(val => val)}
            <CompactButton
                icon="/icons/btn-delete.svg"
                onclick={(evt) => {
                    // for selection...
                    for (let i of Object.keys(selected.all).toReversed()) {
                        // go in reverse order so we don't mess up indices
                        if (selected.all[i]) {
                            // delete item
                            param.val.splice(i, 1)
                            // clear editing
                            editing.splice(i, 1)
                        }
                    }
                    // reset selection
                    selected.all = []
                    selected.last = undefined
                }}
                tooltip={translate("Delete selected")}
                disabled={disabled}
            />
        {/if}
    </div>
</div>

<svelte:window
    onclick={evt => {
        // deselect on click off
        if (!handle?.contains?.(evt.target)) {
            selected.all = []
            selected.last = undefined
        }
    }}
/>

<style>
    .layout {
        display: flex;
        flex-grow: 1;
        flex-direction: column;
        justify-items: flex-start;
        flex-grow: 1;
        gap: .25rem;
        border: 1px solid var(--overlay);
        padding: .5rem;
        border-radius: .5rem;
    }
    .item {
        display: flex;
        flex-direction: row;
        gap: .5rem;
        min-height: 1rem;
    }
    .item button {
        min-height: 1.5em;
        background-color: var(--base);
        border: 1px solid var(--overlay);
        padding: .25rem 1rem;
        border-radius: .5rem;
        flex-grow: 1;
        text-align: left;
        z-index: 0;
    }
    button:focus,
    button:hover,
    button.selected {
        border-color: var(--blue);
        box-shadow: inset 1px 1px 10px rgba(0, 0, 0, 0.05);
    }
    button.selected {
        border-color: var(--blue);
        box-shadow: inset 1px 1px 10px var(--overlay);
    }
    button.code {
        font-family: var(--mono);
        font-weight: bold;
    }
    .ctrls {
        display: flex;
        flex-direction: row;
        justify-content: flex-end;
        gap: .5rem;
        margin-top: .5rem;
    }

    .entry-point {
        flex-grow: 1;
        height: 2rem;
        margin: -1.125rem 2rem;
    }
</style>