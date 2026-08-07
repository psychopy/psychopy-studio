<script>
    let {
        param=$bindable(),
        /** @prop @type {boolean} Controls whether this control is disabled */
        disabled=false
    } = $props()
</script>

<input 
    class=param-bool-input 
    type="checkbox" 
    id={param.name}
    bind:checked={
        () => [true, "true", "True", 1, "1"].includes(param.val),
        (val) => param.val = val
    } 
    disabled={disabled}
/>

<style>
    input[type=checkbox] {
        flex-grow: 0;
        align-self: center;
    }

    input[type=checkbox]:focus,
    input[type=checkbox]:hover {
        box-shadow: 0px 0px 1px .5px var(--blue);
        border: 1px solid var(--blue);
    }
</style>