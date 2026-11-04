<script>
    import { translate } from "$lib/translation"

    let {
        value=$bindable(),
        /** @prop @type {string|undefined} Placeholder text to display before typing */
        placeholder=undefined,
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
    <input
        type=text
        class=input-text-ctrl
        list="{id}-options"
        placeholder={placeholder}
        aria-label={placeholder || translate("Input")}
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
        flex-direction: row;
        gap: .5rem;
    }
    .input-text-ctrl{
        flex-grow: 1;
    }
</style>