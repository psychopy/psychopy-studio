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

    function validateMultiText(param, valid) {
        if (this.isCode) {
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
<textarea 
    class=param-text-input-multi
    bind:value={param.val} 
    class:valid={param.valid.value} 
    class:code={param.isCode} 
    disabled={disabled}
    id={param.name}
    {@attach element => param.registerValidator("multiText", validateMultiText, 10)}
    {...attachments}
>
</textarea>

<style>
    textarea {
        font-family: inherit;
        font-size: inherit;
        font-weight: inherit;
        color: inherit;
        flex-grow: 1;
        min-height: 10rem;
        resize: vertical;
    }
    textarea:not(.valid) {
        color: var(--red);
    }
    textarea.code {
        font-family: var(--mono);
        font-weight: bold;
    }

    .code-indicator {
        align-self: center;
    }
</style>