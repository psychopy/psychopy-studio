<script>
    import { Dialog } from "$lib/utils/dialog";
    import { getContext, onMount, setContext } from "svelte";
    import { electron } from "$lib/globals.svelte";
    import path from "path-browserify";
    import DemoTile from "./DemoTile.svelte";

    let {
        shown=$bindable()
    } = $props()

    let current = getContext("current");

    let localDemos = $state({});
    setContext("localDemos", localDemos);

    setContext("closeDlg", evt => shown = false)

    let localDemosFile = $state.raw()

    onMount(async () => {
        // get json file which keeps track of downloaded demos
        localDemosFile = path.join(await electron.paths.user(), "demos.json")
        // make sure it exists
        if (!(await electron.files.exists(localDemosFile))) {
            await electron.files.save(localDemosFile, "{}")
        }
        // read its contents
        electron.files.load(localDemosFile).then(
            content => Object.assign(localDemos, JSON.parse(content))
        )
    })

    $effect(() => {
        if (localDemosFile && localDemos) {
            electron.files.save(localDemosFile, JSON.stringify(localDemos, undefined, 4))
        }
    })

    let searchTerm = $state.raw("")


    async function getDemos() {
        // request from Pavlovia
        let data = await fetch(
            "/api/demos",
            {
                headers: current.user?.token
            }
        ).then(
            resp => resp.json()
        )

        return data.experiments
    }

    function matches(term, profile) {
        return (
            profile.name.toLowerCase().includes(term.toLowerCase()) ||
            profile.description.toLowerCase().includes(term.toLowerCase()) || 
            term === ""
        )
    }
</script>

<Dialog
    bind:shown={shown}
>
    <div class=container>
        <input type=search bind:value={searchTerm} placeholder="Search demos..." />
        <div class=demos-array>
            {#await getDemos()}
                Loading demos...
            {:then demos}
                {#each demos as demo}
                    {#if matches(searchTerm, demo)}
                        <DemoTile 
                            demo={demo} 
                        />
                    {/if}
                {/each}
            {:catch err}
                Failed to load demos

                <pre>
                    {err}
                </pre>
            {/await}
        </div>
    </div>
</Dialog>

<style>
    .container {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding: 1rem;
        box-sizing: border-box;
        height: 100%;
    }
    .demos-array {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        width: 66rem;
        overflow-y: auto;
        height: 100%;
        padding: 1rem;
        box-sizing: border-box;
    }

    
</style>
