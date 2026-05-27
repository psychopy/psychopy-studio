<script>
    import { Icon } from "$lib/utils/icons";
    import TreeNode from "./TreeNode.svelte";


    let {
        label,
        icon=undefined,
        onselect=(evt, data) => {},
        onactivate=(evt, data) => {},
        open=$bindable(false),
        /** @interface */
        children
    } = $props()
</script>

<div 
    class=tree-branch
>
    <TreeNode
        label={label}
        icon={icon}
        onselect={(evt, data) => {
            open = !open;
            onselect(evt, data)
        }}
        onactivate={onactivate}
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