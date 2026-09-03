<script>
    import { CompactButton } from "$lib/utils/buttons";
    import { translate } from "$lib/translation";

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

    let selection = $state({
        start: undefined,
        end: undefined
    });

    /**
     * Applies the given formatting strings to the current selection
     * 
     * @param before {Object<md: string, html: string>} Strings to prepend (according to formatting syntax)
     * @param html {Object<md: string, html: string>} Strings to append (according to formatting syntax)
     */
    function applyFormat(before, after) {
        // get formatting syntax
        let syntax = $state.snapshot(
            param.siblings?.['formattingSyntax']?.val
        )
        // abort if formatting syntax is unrecognised
        if (before[syntax] === undefined || after[syntax] == undefined) {
            return
        }
        // append and prepend strings
        param.val = param.val.slice(0, selection.start) + before[syntax] + param.val.slice(selection.start, selection.end) + after[syntax] + param.val.slice(selection.end)
    }
</script>

{#if codeIndicator}
    <span 
        class=code-indicator
    >
        $
    </span>
{/if}
<div class=param-text-input-multi>
    {#if ["md", "html"].includes(param.siblings?.['formattingSyntax']?.val)}
        <div class=ctrls>
            <CompactButton 
                tooltip={translate("Bold")}
                onclick={evt => applyFormat(
                    {md: "**", html: "<b>"},
                    {md: "**", html: "</b>"}
                )}
                disabled={
                    selection.start === undefined || selection.end === selection.start
                }
                icon="/icons/btn-bold.svg"
            />
            <CompactButton 
                tooltip={translate("Italic")}
                onclick={evt => applyFormat(
                    {md: "*", html: "<i>"},
                    {md: "*", html: "</i>"}
                )}
                disabled={
                    selection.start === undefined || selection.end === selection.start
                }
                icon="/icons/btn-italic.svg"
            />
        </div>
    {/if}
    <textarea 
        bind:value={param.val} 
        onselectionchange={evt => {
            selection.start = evt.target?.selectionStart;
            selection.end = evt.target?.selectionEnd;
        }}
        class:valid={param.valid.value} 
        class:code={param.isCode} 
        disabled={disabled}
        id={param.name}
        {@attach element => param.registerValidator("multiText", validateMultiText, 10)}
        {...attachments}
    >
    </textarea>
    
</div>


<style>
    .param-text-input-multi {
        display: flex;
        flex-direction: column;
        flex-grow: 1;
        border: 1px solid var(--overlay);
        border-radius: .5rem;
        overflow: hidden;
    }

    .ctrls {
        display: flex;
        flex-direction: row;
        gap: .5rem;
        padding: .5rem 1rem;
        border-bottom: 1px solid var(--overlay);
        background-color: var(--mantle);
    }

    textarea {
        font-family: inherit;
        font-size: inherit;
        font-weight: inherit;
        color: inherit;
        flex-grow: 1;
        min-height: 10rem;
        resize: vertical;
        border-radius: 0;
        border: none;
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