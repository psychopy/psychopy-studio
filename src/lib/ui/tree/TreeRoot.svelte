<script>
    import { setContext } from "svelte";

    let {
        /** Make this control sit flush (e.g. in a panel) */
        flush=false,
        /** @prop {Snippet} children Child elements are rendered inside div */
        children,
        /** @prop {ComponentProps} props Other props are passed to div element */
        ...props
    } = $props()

    let nodes = $state({
        selected: undefined
    });

    setContext("siblings", nodes);
</script>

<div 
    class=tree-root
    class:flush
    {...props}
>
    {@render children?.()}
</div>

<style>
    .tree-root {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        gap: .25rem;
        background-color: var(--base);
        flex-grow: 1;
        padding-bottom: 1rem;
        box-sizing: border-box;
    }
    .tree-root:not(.flush) {
        border: 1px solid var(--overlay);
        border-radius: .5rem;
    }
</style>