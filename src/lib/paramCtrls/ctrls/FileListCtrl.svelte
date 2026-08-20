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
                // open file browser
                let files = await browseFileOpen(types, current.experiment?.file?.parent, true)
                // apply to param
                for (let file of files) {
                    // make relative
                    let rel = path.relative(current.experiment?.file?.parent, file.file)
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