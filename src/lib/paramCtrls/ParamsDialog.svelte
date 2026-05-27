<script>
    import Dialog from "$lib/utils/dialog/Dialog.svelte";
    import { ParamsNotebook } from "$lib/paramCtrls/index.js";
    import { translate } from "$lib/translation";

    let {
        /** @prop @type {import("$lib/experiment/param.svelte.js")<HasParams>} Element which this dialog edits */
        element,
        /** @bindable State controlling this dialog's visibility */
        shown=$bindable(),
        /** @prop @type {object} Additional buttons beyond the standard OK, APPLY, CANCEL and HELP */
        extraButtons={},
        /** @prop @type {function} Function to execute when param changes are applied */
        onapply=(evt) => {},
        /** @prop @type {function} Function to execute when this dialog closes */
        onclose=(evt) => {}
    } = $props()

    let valid = $derived(
        Object.values(element.params).every(
            param => param.valid.value
        )
    )    

    let btnsDisabled = $derived({
        OK: !valid,
        APPLY: !valid
    })

</script>


<Dialog 
    id="{element.name}-parameters"
    title={`${translate("Editing")}: ${element.name || element.tag}`}
    bind:shown={shown} 
    onclose={onclose}
    onopen={() => element.restore.set()}
    buttons={{
        OK: evt => {
            element.trim();
            element.restore.set();
            onapply(evt);
        }, 
        APPLY: evt => {
            element.trim();
            element.restore.set();
            onapply(evt);
        }, 
        EXTRA: extraButtons,
        CANCEL: evt => {
            element.restore.apply()
        }, 
        HELP: element.helpLink,
    }}
    buttonsDisabled={btnsDisabled}
>
    <ParamsNotebook 
        element={element}
    />
</Dialog>