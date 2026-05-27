<script>
    let {
        /** @prop @type {import("$lib/experiment").Param} Param object to which this ctrl pertains */
        param=$bindable(),
        /** @prop @type {boolean} Controls whether this control is disabled */
        disabled=false,
        /** @prop @type {Boolean} Should the code indicator ($) be shown? */
        codeIndicator = param.isCodeType,
        /** @interface */
        ...attachments
    } = $props()

    function validateText(param, valid) {
        if (param.isCode) {
            valid.value = true
            valid.warning = undefined
        }
    }
</script>

{#if codeIndicator}
    <span 
        class=code-indicator
    >
        $
    </span>
{/if}

<input 
    class=param-text-input-single 
    type="text" 
    id={param.name}
    bind:value={param.val} 
    class:valid={param.valid.value} 
    class:code={param.isCode} 
    disabled={disabled}
    {@attach element => param.registerValidator("text", validateText, 10)}
    {...attachments}
/>

<style>
    input {
        flex-grow: 1;
        color: var(--text);
    }
    input:not(.valid) {
        color: var(--red);
    }
    input.code {
        font-family: var(--mono);
        font-weight: bold;
    }
    .code-indicator {
        align-self: center;
    }
</style>