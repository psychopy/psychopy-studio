<script>
    import { TreeRoot } from "$lib/utils/tree";
    import { electron } from "$lib/globals.svelte";
    import { getContext } from "svelte";
    import DirCtrl from "./DirCtrl.svelte";
    import FolderNode from "./FolderNode.svelte";

    let current = getContext("current")

    let directory = $state.raw()

    // let tree = $derived(transformTree(directory.files))

    // start off with home directory
    electron.paths.documents().then(
        resp => directory = resp
    )
</script>

<div class=file-explorer>
    <DirCtrl 
        bind:value={directory}
    />

    <TreeRoot>
        <FolderNode
            bind:value={directory}
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