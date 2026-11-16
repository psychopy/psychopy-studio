<script>
    import { Icon } from "$lib/ui/icon";
    import TreeNode from "./TreeNode.svelte";


    let {
        label,
        icon=undefined,
        onselect=(evt, data) => {},
        onactivate=(evt, data) => {},
        oncontextmenu=(evt, data) => {},
        open=$bindable(false),
        /** @prop {Snippet} children Child elements are rendered in the div that's shown when open */
        children,
        /** @prop {ComponentProps} props Other props are passed to the container div */
        ...props
    } = $props()
</script>

<div 
    class=tree-branch
    {...props}
>
    <TreeNode
        label={label}
        icon={icon}
        onselect={(evt, data) => {
            open = !open;
            onselect(evt, data)
        }}
        onactivate={onactivate}
        oncontextmenu={oncontextmenu}
    >
        <!-- arrow showing open state -->
        {#snippet chevron()}
            <Icon 
                src="/icons/sym-arrow-{open ? "down" : "right"}.svg"
                size=".5rem"
            />
        {/snippet}
    </TreeNode>
    
    {#if open}
        <div class=tree-branch-nodes>
            {@render children?.()}
        </div>
    {/if}
</div>

<style>
    .tree-branch {
        display: flex;
        flex-direction: column;
    }
    .tree-branch-nodes {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        margin-left: 1rem;
        border-left: 1px solid var(--mantle);
    }
    .tree-branch-nodes:hover,
    .tree-branch-nodes:active {
        border-color: var(--overlay)
    }

</style>