<script>
    import { Param } from "$lib/experiment";
    import { CompactButton } from "$lib/utils/buttons";
    import { sanitizeJSON } from "$lib/utils/transpiler"
    import FileCtrl from "./FileCtrl.svelte";
    import { mimeTypesFromParam } from "./utils";
    import { translate } from "$lib/translation";

    let {
        param=$bindable(),
        /** @prop @type {boolean} Controls whether this control is disabled */
        disabled=false,
        /** @interface */
        ...attachments
    } = $props()
    
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
                if (typeof item.val === "object") {
                    console.log(param.val.flat())
                }
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

</script>

<div 
    class=list-ctrl-layout
    {@attach element => param.registerValidator("fileList", validateFileList, -5)}
    {...attachments}
>
    {#each Object.entries(items) as [i, item]}
        <FileCtrl
            param={item}
            disabled={disabled}
        />
        <CompactButton
            icon="/icons/btn-delete.svg"
            onclick={(evt) => {
                param.val.splice(i, 1)
            }}
            disabled={disabled}
            tooltip={translate("Remove item")}
        />
    {/each}
    <div class=gap></div>
    <CompactButton 
            icon="/icons/btn-add-many.svg"
            onclick={async (evt) => {
                // do we have mime types from the param?
                let types = mimeTypesFromParam(param)
                // get file handle from system dialog
                let handles = await window.showOpenFilePicker({
                    types: types,
                    multiple: true
                });
                // get all files
                for (let handle of handles) {
                    // get file blob from handle
                    let file = await handle.getFile();
                    // get name from blob
                    param.val.push(file.name)
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
        }}
        tooltip={translate("Add item")}
        disabled={disabled}
    />
</div>

<style>
    .list-ctrl-layout {
        flex-grow: 1;
        display: grid;
        grid-template-columns: [value] auto [browse] min-content [delete] min-content;
        gap: .5rem;
    }
</style>