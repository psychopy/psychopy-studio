<script>
    import { Param } from "$lib/experiment";
    import { Button } from "$lib/ui/button";
    import { MenuItem } from "$lib/ui/menu";
    import { Dialog, DialogButton } from "$lib/ui/dialog";
    import { sanitizeJSON } from "$lib/utils/transpiler"
    import FileCtrl from "./FileCtrl.svelte";
    import { mimeTypesFromParam } from "./utils.svelte";
    import { browseFileOpen } from "$lib/utils/files.js";
    import path from "path-browserify";
    import { translate } from "$lib/translation";
    import { getContext, untrack } from "svelte";

    let {
        param=$bindable(),
        /** @prop @type {boolean} Controls whether this control is disabled */
        disabled=false,
        /** @interface */
        ...attachments
    } = $props()

    let current = getContext("current");

    let selected = $state([]);
    // index of the item currently being edited, if any
    let editing = $state();
    // stores a restore point while editing an item
    let restore = $state.raw("");
    
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

    // if items are removed from elsewhere (e.g. undo), drop selection/editing indices which no longer exist
    $effect(() => {
        let n = items.length
        // only depend on items, as writing to selected/editing would otherwise retrigger this
        untrack(() => {
            if (selected.some(i => i >= n)) {
                selected = selected.filter(i => i < n)
            }
            if (editing >= n) {
                editing = undefined
            }
        })
    })

    /**
     * Edit the selected item
     */
    function editSelected() {
        // do nothing if nothing is selected
        if (!selected.length) {
            return
        }
        // set editing to open a dialog
        editing = parseInt(selected[0])
    }

    /**
     * Delete the selected item(s)
     */
    function deleteSelected() {
        // remove selected items
        selected.toSorted(
            (a, b) => b - a
        ).forEach(
            i => param.val.splice(i, 1)
        )
        // indices no longer point to the same items, so clear selection
        selected = []     
    }

    /**
     * Add a blank item and start editing it
     */
    function addText() {
        // add a blank value
        param.val.push("")
        // start editing it
        editing = param.val.length - 1
    }

    /**
     * Add a file or files as items
     */
    async function addFiles() {
        // do we have valid mime types from the param?
        let types = mimeTypesFromParam(param)
        // open file browser
        let files = await browseFileOpen(types, current.experiment?.file?.parent, true)
        // abort if no files
        if (!files) {
            return
        }
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
    }

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

</script>

<div 
    class=list-ctrl-layout
    {@attach element => param.registerValidator("fileList", validateFileList, -5)}
    {...attachments}
>
    <select 
        id={param.name}
        bind:value={selected}
        onkeydown={evt => {
            // if user presses delete key, delete selected item(s)
            if (evt.key === "Delete") {
                evt.preventDefault()
                deleteSelected()
            }
            // if user presses enter, edit first selected item
            if (evt.key === "Enter") {
                evt.preventDefault()
                editSelected()
            }
        }}
        onclick={evt => {
            // if "clicked off" (i.e. clicked on select but no option), deselect
            if (
                // clicked the select itself
                evt.target === evt.currentTarget
                // and not its scrollbar
                && evt.offsetX < evt.currentTarget.clientWidth
                && evt.offsetY < evt.currentTarget.clientHeight
            ) {
                selected = []
            }
        }}
        disabled={disabled}
        multiple
    >
        {#each Object.entries(items) as [i, item]}
            <option 
                value={i}
                ondblclick={evt => editing = i}
                class:valid={item.valid.value} 
                class:code={item.isCode}
            >
                {item.val}
            </option>
        {/each}
    </select>
    
    <div class=list-ctrl-buttons>
        {#if selected.length}
            <Button
                label={translate("Delete")}
                icon="/icons/btn-delete.svg"
                onclick={deleteSelected}
                disabled={disabled}
                data-testid=remove-item
                small
            />
        {/if}
        {#if selected.length === 1}
            <Button
                label={translate("Edit")}
                icon="/icons/btn-edit.svg"
                onclick={editSelected}
                disabled={disabled}
                data-testid=edit-item
                small
            />
        {/if}
        <Button 
            label={translate("Add files...")}
            icon="/icons/btn-add.svg"
            onclick={addFiles}
            disabled={disabled}
            data-testid=add-files
            small
        >
            {#snippet menu(shown)}
                <MenuItem 
                    label={translate("Add as text")}
                    icon="/icons/btn-edit.svg"
                    onclick={addText}
                    data-testid=add-text
                />
            {/snippet}
        </Button>
    </div>
</div>

 <Dialog
    title={translate("Edit value")}
    bind:shown={
        () => editing !== undefined,
        (value) => { if (!value) editing = undefined }
    }
    onopen={evt => restore = $state.snapshot(items[editing].val)}
    shrink
    data-testid=edit-list-item
>
    <div
        class=edit-dlg-content
    >
        <FileCtrl 
            param={items[editing]}
            disabled={disabled}
        />
    </div>
    {#snippet buttons()}
        <DialogButton 
            action="OK"
            disabled={!items[editing].val || !items[editing].valid.value}
        />
        <DialogButton 
            action="CANCEL"
            onclick={evt => {
                if (restore) {
                    // if we're editing, revert to what it was
                    items[editing].val = restore
                } else {
                    // if this was added fresh, remove it
                    param.val.splice(editing, 1)
                }
                
            }}
        />
    {/snippet}
</Dialog>

<style>
    .list-ctrl-layout {
        display: flex;
        flex-direction: column;
        flex-grow: 1;
        gap: .5rem;
    }
    .list-ctrl-buttons {
        display: flex;
        flex-direction: row;
        align-self: flex-end;
        gap: .5rem;
    }

    .edit-dlg-content {
        display: flex;
        flex-direction: row;
        gap: .5rem;
        padding: 1rem;
    }

    select {
        resize: vertical;
    }

    option:not(.valid) {
        color: var(--red);
    }
    option.code {
        font-family: var(--mono);
        font-weight: bold;
    }
</style>