<script>
    import { Menu, MenuItem } from "$lib/utils/menu";
    import FolderNode from "./FolderNode.svelte";
    import FileNode from "./FileNode.svelte";
    import { TreeBranch, TreeNode } from "$lib/utils/tree";
    import { parsePath } from "$lib/utils/files";
    import path from "path-browserify";
    import { electron } from "$lib/globals.svelte";
    import { translate } from "$lib/translation";

    let {
        value=$bindable(),
        top=false
    } = $props();

    let contextMenu = $state({
        shown: false,
        pos: {
            x: undefined,
            y: undefined
        }
    })
</script>

<TreeBranch
    label={parsePath(value || "").name}
    oncontextmenu={(evt, data) => {
        evt.preventDefault();
        // show menu
        contextMenu.shown = true;
        // set its position to the mouse pos
        contextMenu.pos.x = evt.pageX;
        contextMenu.pos.y = evt.pageY;
    }}
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

<Menu
    bind:shown={contextMenu.shown}
    bind:position={contextMenu.pos}
>
    <MenuItem 
        label={translate("Reveal in file explorer")}
        onclick={async (evt, data) => {
            await electron.files.showItemInFolder(value)
            contextMenu.shown = false
        }}
    />
</Menu>