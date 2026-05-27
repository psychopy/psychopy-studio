<script>
    let {
        value=$bindable(),
        label=undefined,
        onsubmit=evt => {},
        onprevious=evt => {},
        onnext=evt => {}
    } = $props()

    let ctrl = $state.raw();
</script>

<textarea 
    bind:this={ctrl}
    bind:value={value}
    aria-label={label}
    onkeypress={evt => {
        // on submit...
        if (evt.key === "Enter" && !evt.shiftKey) {
            evt.preventDefault()
            onsubmit(evt)
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
>
</textarea>

<style>
    textarea {
        field-sizing: content;
        font-family: var(--mono);
        resize: none;
    }
</style>