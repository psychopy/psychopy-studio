<script>
    import { Dialog } from "$lib/utils/dialog";
    import { CompactButton } from "$lib/utils/buttons";
    import { getContext, onMount } from "svelte";
    import { electron, git } from "$lib/globals.svelte";
    import { browseFileOpen } from "$lib/utils/files";
    import { openIn } from "$lib/utils/views.svelte"
    import path from "path-browserify";

    let {
        shown=$bindable()
    } = $props()

    let current = getContext("current");

    let local = $state({
        file: undefined,
        content: undefined
    })
    // whenever the local state changes, update the JSON file
    $effect(() => {
        if (local.file && local.content) {
            electron.files.save(local.file, JSON.stringify(local.content, undefined, 4))
        }
    })

    onMount(async () => {
        // get json file which keeps track of downloaded demos
        local.file = path.join(await electron.paths.user(), "demos.json")
        // make sure it exists
        if (!(await electron.files.exists(local.file))) {
            await electron.files.save(local.file, "{}")
        }
        // read its contents
        electron.files.load(local.file).then(
            content => local.content = JSON.parse(content)
        )
    })


    async function getDemos() {
        // request from Pavlovia
        let data = await fetch(
            "/api/demos",
            {
                headers: current.user.token
            }
        ).then(
            resp => resp.json()
        )

        return data.experiments
    }
</script>

<Dialog
    bind:shown={shown}
>
    <div class=demos-array>
        {#await getDemos()}
            Loading demos...
        {:then demos}
            {#each demos as demo}
                <div class=demo-button>
                    <b>{demo.name}</b>
                    {#if demo.avatarUrl}
                        <img alt=avatar src={demo.avatarUrl} />
                    {/if}
                    <div class=ctrls>
                        {#if local.content?.[demo.pathWithNamespace]}
                            <CompactButton
                                icon="/icons/btn-sendbuilder.svg"
                                tooltip="Open in Builder"
                                onclick={async evt => {
                                    // get first psyexp file we can find
                                    let expFile
                                    for (let file of await electron.files.scandir(local.content[demo.pathWithNamespace])) {
                                        if (file.endsWith(".psyexp")) {
                                            expFile = file
                                            break
                                        }
                                    }
                                    // open it in builder
                                    openIn(
                                        path.join(local.content[demo.pathWithNamespace], expFile), "builder"
                                    )
                                    // close dialog
                                    shown = false
                                }}
                            />
                        {:else}
                            <CompactButton
                                icon="/icons/btn-download.svg"
                                tooltip="Download"
                                onclick={async evt => {
                                    // user picks a folder
                                    let folder = await browseFileOpen([], "", true)
                                    if (folder) {
                                        // clone from gitlab
                                        await git.clone(demo.gitlabUrl, folder.file)
                                        // store local folder
                                        local.content[demo.pathWithNamespace] = folder.file
                                    }
                                    
                                }}
                            />
                        {/if}
                        <CompactButton
                            icon="/icons/rbn-pavlovia.svg"
                            tooltip="View online"
                            onclick={evt => window.open(demo.pavloviaUrl.replace("run.pavlovia.org", "pavlovia.org"))}
                        />
                        <CompactButton
                            icon="/icons/btn-runjs.svg"
                            tooltip="Run online"
                            onclick={evt => window.open(demo.pavloviaUrl)}
                        />
                    </div>
                </div>
            {/each}
        {:catch err}
            Failed to load demos

            <pre>
                {err}
            </pre>
        {/await}
    </div>
</Dialog>

<style>
    .demos-array {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        gap: 1rem;
        padding: 1rem;
        width: 66rem;
    }

    .demo-button {
        display: flex;
        flex-direction: column;
        gap: .5rem;
        align-items: center;
        border: 1px solid var(--overlay);
        border-radius: .5rem;
        min-width: 10rem;
        padding: 1rem;
        box-sizing: border-box;
    }

    .demo-button .ctrls {
        display: flex;
        flex-direction: row;
        justify-items: start;
        gap: .5rem;
        width: 100%;
    }

    .demo-button img {
        width: 8rem;
        height: 8rem;
        border-radius: .5rem;
    }
</style>
