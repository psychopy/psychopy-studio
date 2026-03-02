<script>
    import { CompactButton } from "$lib/utils/buttons";
    import { browseFileOpen } from "$lib/utils/files";
    import { openIn } from "$lib/utils/views.svelte";
    import { getContext } from "svelte";
    import { git } from "$lib/globals.svelte";
    import path from "path-browserify";


    let {
        demo
    } = $props()

    let localDemos = getContext("localDemos");
    let closeDlg = getContext("closeDlg");
</script>

<div class=demo-tile>
    {#if demo.avatarUrl}
        <img alt=avatar src={demo.avatarUrl} />
    {/if}

    <div class=description>
        <h2>{demo.name}</h2>
        <p>{demo.description}</p>

        <div class=ctrls>
            {#if localDemos[demo.pathWithNamespace]}
                <CompactButton
                    icon="/icons/btn-sendbuilder.svg"
                    tooltip="Open in Builder"
                    onclick={async evt => {
                        // get first psyexp file we can find
                        console.log(localDemos[demo.pathWithNamespace])
                        let expFile
                        for (let file of await electron.files.scandir(localDemos[demo.pathWithNamespace])) {
                            if (file.endsWith(".psyexp")) {
                                expFile = file
                                break
                            }
                        }
                        // open it in builder
                        openIn(
                            path.join(localDemos[demo.pathWithNamespace], expFile), "builder"
                        )
                        // close dialog
                        closeDlg()
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
                            localDemos[demo.pathWithNamespace] = folder.file
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
    
</div>

<style>
    .demo-tile {
        display: flex;
        flex-direction: row;
        gap: 1rem;
        align-items: center;
        border: 1px solid var(--overlay);
        border-radius: .5rem;
        padding: 1rem;
        box-sizing: border-box;
        background-color: var(--base);
    }


    .demo-tile .ctrls {
        display: flex;
        flex-direction: row;
        justify-items: start;
        gap: .5rem;
        width: 100%;
    }

    .demo-tile img {
        width: 8rem;
        border-radius: .5rem;
    }
</style>