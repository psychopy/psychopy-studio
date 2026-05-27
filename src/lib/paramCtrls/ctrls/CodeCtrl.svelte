<script>
    import { CodeEditor } from "$lib/utils/code";

    let {
        /** @prop @type {import("$lib/experiment").Param} Param object to which this ctrl pertains */
        param=$bindable(),
        /** @prop @type {boolean} Controls whether this control is disabled */
        disabled=false,
        /** @interface */
        ...attachments
    } = $props()

    function validateCode(param, valid) {
        return
    }

    let language = $derived(
        param.allowedVals ? param.allowedVals : "python"
    )

</script>
<div 
    class=param-code-input-multi
    id={param.name}
    {@attach element => param.registerValidator("code", validateCode, 10)}
    {...attachments}
>
    <CodeEditor 
        bind:value={param.val}
        language={language}
        readonly={disabled}
        disabled={disabled}
    />
</div>

<style>
    .param-code-input-multi {
        position: relative;
        width: 100%;
        border: 1px solid var(--overlay);
        padding: .5rem;
    }
</style>