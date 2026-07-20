<script>
    import SingleLineCtrl from "./SingleLineCtrl.svelte";
    import { Button, CompactButton } from "$lib/utils/buttons";
    import { mimeTypesFromParam } from "./utils.svelte";
    import { browseFileOpen } from "$lib/utils/files.js";
    import { getContext } from "svelte";

    let {
        /** @prop @type {import("$lib/experiment").Param} Param object to which this ctrl pertains */
        param=$bindable(),
        /** @prop @type {boolean} Controls whether this control is disabled */
        disabled=false,
        /** @bindable State tracking whether this param's value is valid */
        valid=$bindable(),
        /** @interface */
        ...attachments
    } = $props()

    let current = getContext("current");

    function validateFile(param, valid) {
        // check file extension
        if (this.allowedVals) {
            if (!param.allowedVals.some(
                val => String(this.val).endsWith(val)
            )) {
                valid.value = false
                valid.warning = `Did not match allowed filetypes: ${this.allowedVals}`
            }
        }
        // todo: Check if file exists
    }

    async function getFile(evt) {
        // do we have mime types from the param?
        let types = mimeTypesFromParam(param)
        // get file
        let file = await browseFileOpen(types, current.experiment?.file?.parent);
        // if one was selected, use it
        if (file) {
            if (current.experiment?.file?.parent) {
                // make relative to experiment path if possible
                param.val = file.file.replace(current.experiment.file.parent, "").replace(/^\//, "")
            } else {
                // otherwise use as absolute
                param.val = file.file
            }
        }
    }
</script>

<SingleLineCtrl 
    bind:param={param} 
    bind:valid={valid}
    disabled={disabled}
    {@attach element => param.registerValidator("file", validateFile, 5)}
    {...attachments}
/>
<CompactButton 
    icon="/icons/btn-open.svg"
    tooltip="Browse for file..."
    onclick={getFile}
    disabled={disabled}
/>
