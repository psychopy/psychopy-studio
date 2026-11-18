<script>
    import { validateSound } from "./validators.svelte.js";
    import FileCtrl from "./FileCtrl.svelte";

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
    
</script>

<FileCtrl 
    bind:param={param}
    disabled={disabled}
    bind:valid={valid}
    {@attach element => param.registerValidator("sound", validateSound, -5)}
    {...attachments}
/>