<script>
    import { getContext } from "svelte";
    import OutlineNode from "./OutlineNode.svelte";
    import TreeRoot from "$lib/utils/tree/TreeRoot.svelte";
    import { translate } from "$lib/translation";
    
    let current = getContext("current");

</script>
<div class=panel>
    {#if current.pages?.[current.tab]}
        <TreeRoot>
            <OutlineNode 
                content={current.pages[current.tab].content}
                index={1}
                type="Script{current.pages[current.tab].file.ext}"
                name={current.pages[current.tab].file.name}
                top
            />
        </TreeRoot>
    {:else}
        <div class=message>
            {translate("No open file")}
        </div>
    {/if}
</div>

<style>
    .panel {
        background-color: var(--base);
        min-height: 100%;
        box-sizing: border-box;
    }
    .message {
        padding: 1rem;
        box-sizing: border-box;
    }
</style>