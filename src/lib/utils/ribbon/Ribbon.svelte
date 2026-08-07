<script>
    import { onMount, setContext } from "svelte";

    let {
        /** @interface */
        children
    } = $props()

    // state which keeps track of the index of each section
    let handle = $state.raw()
    onMount(
        () => setContext("ribbon", handle) 
    )
</script>

<div id=ribbon bind:this={handle}>
    {@render children()}
</div>

<style>
    /* --- Frame ribbon ---*/

    #ribbon {
        display: flex;
        flex-direction: row;
        padding: .5em;
        background-color: var(--crust);
        position: relative;
    }    
</style>