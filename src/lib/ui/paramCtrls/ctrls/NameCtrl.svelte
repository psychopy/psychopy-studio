<script>
    import { validateName } from "./validators.svelte.js";
    import { getContext } from "svelte";
    import SingleLineCtrl from "./SingleLineCtrl.svelte";

    let {
        param=$bindable(),
        /** @prop @type {boolean} Controls whether this control is disabled */
        disabled=false,
        /** @interface */
        ...attachments
    } = $props()

    let current = getContext("current")
</script>

<SingleLineCtrl
    param={param}
    checkCode={(param) => false}
    codeIndicator={false}
    disabled={disabled}
    {@attach element => param.registerValidator("name", (param, valid) => validateName(param, valid, current), -5)}
    {...attachments}
/>