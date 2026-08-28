<script>
    import { TreeRoot } from "$lib/utils/tree";
    import { electron } from "$lib/globals.svelte";
    import { getContext } from "svelte";
    import DirCtrl from "./DirCtrl.svelte";
    import FolderNode from "./FolderNode.svelte";

    let current = getContext("current")

    // start off with home directory
    electron.paths.documents().then(
        resp => current.directory = resp
    )
</script>

<div class=file-explorer>
    <DirCtrl 
        bind:value={current.directory}
    />

    <TreeRoot>
        <FolderNode
            bind:value={current.directory}
            top
        />
    </TreeRoot>
</div>

<style>
    .file-explorer {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        height: 100%;
        background-color: var(--base);
    }
</style>