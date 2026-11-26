<script>
    import { translate } from "$lib/translation"

    let {
        value=$bindable(),
        placeholder=translate("Type here..."),
        label=undefined,
        onsubmit=evt => {},
        onprevious=evt => {},
        onnext=evt => {},
        busy=$bindable(),
        disabled=false
    } = $props()

    let ctrl = $state.raw();
</script>

<textarea 
    bind:this={ctrl}
    bind:value={value}
    placeholder={busy ? translate("...") : placeholder}
    aria-label={label}
    onkeypress={async evt => {
        // ignore if busy
        if (busy) return
        // on submit...
        if (evt.key === "Enter" && !evt.shiftKey) {
            evt.preventDefault()
            // mark as busy
            busy = true
            // execute submit function
            try {
                await onsubmit(evt)
            } finally {
                // mark as not busy
                busy = false
            }
        }
    }}
    onkeydown={evt => {
        // on previous command...
        if (evt.key === "ArrowUp" && ctrl.selectionStart === ctrl.selectionEnd && ctrl.selectionStart === 0) {
            evt.preventDefault()
            onprevious(evt)
        }
        if (evt.key === "ArrowDown" && ctrl.selectionStart === ctrl.selectionEnd && ctrl.selectionStart === value.length) {
            evt.preventDefault()
            onnext(evt)
        }
    }}
    readonly={busy}
    disabled={disabled}
>
</textarea>

<style>
    textarea {
        field-sizing: content;
        box-sizing: border-box;
        min-height: 2em;
        font-family: var(--mono);
        resize: none;
    }
</style>