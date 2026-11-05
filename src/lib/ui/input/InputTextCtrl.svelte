<script>
    import { translate } from "$lib/translation"

    let {
        value=$bindable(),
        /** @prop @type {string|undefined} Placeholder text to display before typing */
        placeholder=undefined,
        /** @prop @type {boolean} Style this code to show that its value is code and not a string */
        code=false,
        /** @prop @type {boolean} If false, style this text in red to show an error */
        valid=true,
        /** @prop @type {Snippet} Snippet defining any markers to add to the left of the control */
        markers=undefined,
        /** @prop @type {Snippet} Options to show while typing (supplied as <option> elements, like in a data list), will be provided with the current value */
        options=undefined,
        /** @prop @type {Snippet} Additional controls */
        buttons=undefined,
        /** @prop @interface object Other keys will be passed to <input> */
        ...attrs
    } = $props()

    // get unique ID from Svelte
    let id = $props.id()
</script>



<div class=input-text-container>
    {@render markers?.()}
    <input
        type=text
        class=input-text-ctrl
        list="{id}-options"
        placeholder={placeholder}
        aria-label={placeholder || translate("Input")}
        class:valid
        class:code
        bind:value={value}
        {...attrs}
    />
    <datalist id="{id}-options">
        {@render options?.(value)}
    </datalist>
    {@render buttons?.()}
</div>

<style>
    .input-text-container {
        display: flex;
        position: relative;
        flex-direction: row;
        gap: .5rem;
    }
    .input-text-ctrl {
        flex-grow: 1;
    }
    .input-text-ctrl:not(.valid) {
        color: var(--red);
    }
    .input-text-ctrl.code {
        font-family: var(--mono);
        font-weight: bold;
    }
</style>