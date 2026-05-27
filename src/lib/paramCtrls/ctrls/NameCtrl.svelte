<script>
    import { getContext } from "svelte";
    import Namespace from "$lib/experiment/namespace.json";
    import SingleLineCtrl from "./SingleLineCtrl.svelte";
    import { translate } from "$lib/translation";

    let {
        param=$bindable(),
        /** @prop @type {boolean} Controls whether this control is disabled */
        disabled=false,
        /** @interface */
        ...attachments
    } = $props()

    function validateName(param, valid) {
        // must have a value
        if (String(param.val).length === 0) {
            valid.value = false
            valid.warning = translate("Must have a name")
        }
        // no spaces
        if (String(param.val).includes(" ")) {
            valid.value = false
            valid.warning = translate("Names cannot include spaces")
        }
        // no protected names
        if (Object.values(Namespace).flat().includes(String(param.val))) {
            valid.value = false
            valid.warning = translate("Name cannot be a protected keyword")
        }
        // no extant names
        if (String(param.val) in current.experiment.namespace) {
            // ...unless it's extant because it's this name
            if (current.experiment.namespace[String(param.val)] !== param) {
                valid.value = false
                valid.warning = translate("Name already in use")
            }
        }
    }

    let current = getContext("current")
</script>

<SingleLineCtrl
    param={param}
    checkCode={(param) => false}
    codeIndicator={false}
    disabled={disabled}
    {@attach element => param.registerValidator("name", validateName, -5)}
    {...attachments}
/>