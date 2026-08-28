<script>
    import FolderNode from "./FolderNode.svelte";
    import FileNode from "./FileNode.svelte";
    import { TreeBranch, TreeNode } from "$lib/utils/tree";
    import { parsePath } from "$lib/utils/files";
    import path from "path-browserify";
    import { getContext } from "svelte";
    import { translate } from "$lib/translation";

    let {
        value=$bindable(),
        top=false
    } = $props();
</script>

<TreeBranch
    label={parsePath(value || "").name}
    open={top}
>
    {#key value}
        {#await electron.files.scandir(value)}
            {translate("Scanning...")}
        {:then files}
            {#each files as file}
                {#await electron.files.stat(
                    path.join(value, file)
                ) then stat}
                    {#if stat.isDirectory}
                        <FolderNode
                            value={path.join(value, file)}
                        />
                    {:else}
                        <FileNode 
                            value={path.join(value, file)}
                        />
                    {/if}
                {:catch err}
                    <TreeNode 
                        label={translate("Protected file")}
                        disabled
                    />
                {/await}
            {/each}
        {:catch err}
            <TreeNode 
                label={translate("Could not access files")}
                disabled
            />
        {/await}
    {/key}
</TreeBranch>