<script>
    import { translate } from "$lib/translation"
    import { untrack } from "svelte"

    let {
        value=$bindable(),
        /** @prop @type {string|undefined} Placeholder text to display before typing */
        placeholder=translate("Search..."),
        /** @prop @type {Snippet} Options to show while searching (supplied as <option> elements, like in a data list), will be provided with the search term */
        options=undefined,
        /** @prop @type {number} Debounce period (ms) to prevent excessive searching */
        debounce=0,
        /** @prop @type {number} Minimum number of characters needed to perform a search (pressing search key will still search) */
        minchars=4,
        /** @prop @type {string} Key which, when pressed, will force a search */
        searchKey="Enter"
    } = $props()

    // get unique ID from Svelte
    let id = $props.id()
    // this stores the current value of the text control
    let current = $state.raw(untrack(() => value) ?? "")
    // apply debounce period
    $effect(() => {
        // get the current value of the control before starting the debounce
        let before = current
        // do we have a debounce at all?
        if (debounce) {
            // start a timer updating the term after debounce period has elapsed
            let timeout = setTimeout(
                () => {
                    if (before.length >= minchars) {
                        value = before
                    }
                }, 
                debounce
            )
            // cancel the timeout on subsequent changes
            return () => clearTimeout(timeout)
        } else {
            // if no debounce period, apply immediately
            value = before
        }
    })
    // if value is changed by a binding, apply this to the current shown value
    $effect(() => {
        current = value ?? ""
    })
</script>


<input 
    type="search"
    class=search-ctrl
    list="{id}-options"
    placeholder={placeholder}
    aria-label={placeholder || translate("Search")}
    onkeydown={evt => {
        if (evt.key === searchKey) {
            value = $state.snapshot(current)
        }
    }}
    bind:value={current}
/>
<datalist id="{id}-options">
    {@render options?.(value)}
</datalist>