<script>
    import { validateFile } from "./validators.svelte.js";
    import { translate } from "$lib/translation";
    import SingleLineCtrl from "./SingleLineCtrl.svelte";
    import { Button } from "$lib/ui/button";
    import { mimeTypesFromParam } from "./utils.svelte";
    import { browseFileOpen, relativeIfInside } from "$lib/utils/files.js";
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

    async function getFile(evt) {
        // do we have mime types from the param?
        let types = mimeTypesFromParam(param)
        // get file
        let file = await browseFileOpen(types, current.experiment?.file?.parent);
        // if one was selected, use it
        if (file) {
            // make relative to experiment folder if inside it
            param.val = relativeIfInside(file.file, current.experiment?.file?.parent)
        }
    }
</script>

<SingleLineCtrl 
    bind:param={param} 
    bind:valid={valid}
    disabled={disabled}
    {@attach element => param.registerValidator("file", (param, valid) => validateFile(param, valid, current.experiment.file?.parent), 5)}
    {...attachments}
/>
<Button
    icon="/icons/btn-open.svg"
    tooltip={translate("Browse for file...")}
    data-testid=browse-file
    onclick={getFile}
    disabled={disabled}
    small
/>
