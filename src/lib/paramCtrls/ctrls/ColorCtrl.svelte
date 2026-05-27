<script>
    import SingleLineCtrl from "./SingleLineCtrl.svelte";
    import { CompactButton } from "$lib/utils/buttons";
    import { ColorPickerDialog } from "$lib/dialogs/colorPicker";
    import { translate } from "$lib/translation";

    let {
        /** @prop @type {import("$lib/experiment").Param} Param object to which this ctrl pertains */
        param=$bindable(),
        /** @prop @type {boolean} Controls whether this control is disabled */
        disabled=false,
        /** @interface */
        ...attachments
    } = $props()

    let show = $state({
        dialog: false
    })

    function validateColor(param, valid) {

    }

</script>


<SingleLineCtrl
    bind:param={param}
    disabled={disabled}
    {@attach element => param.registerValidator("color", validateColor, 5)}
    {...attachments}
/>

<CompactButton 
    icon="/icons/btn-colors.svg"
    tooltip={translate("Open color picker")}
    onclick={evt => show.dialog = true}
/>

<ColorPickerDialog 
    bind:value={param.val}
    bind:space={param.siblings.colorSpace.val}
    allowedSpaces={param.siblings.colorSpace.allowedVals}
    target=param
    bind:shown={show.dialog}
    buttonsDisabled={{
        OK: !param.valid,
        APPLY: !param.valid
    }}
/>