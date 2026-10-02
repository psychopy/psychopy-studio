<script>
    import ProjectPanel from "./ProjectPanel.svelte";
    import { PanelButton } from "$lib/utils/buttons"
    import { translate } from "$lib/translation";

    let requestDemos = fetch("https://pavlovia.org/api/v2/experiments?search=demos&designer=demos").then(
        resp => resp.json()
    ).then(
        resp => resp.experiments.reduce((acc, demo) => {
            // for each keyword...
            for (let keyword of demo.keywords || []) {
                // look for only keywords beginning with @
                if (keyword.startsWith("@")) {
                    keyword = keyword.slice(1)
                } else {
                    continue
                }
                // make sure there's an entry for this category
                if (!(keyword in acc)) {
                    acc[keyword] = []
                }
                acc[keyword].push(demo)
            }

            return acc
        }, {})
    )

    let selectedDemo = $state.raw()

    let searchTerm = $state.raw("")

    function searchDemos(demos) {
        // start with blank output
        let output = {}
        // iterate through categories
        for (let categ in demos) {
            // filter for matching demos
            let matchingDemos = demos[categ].filter(
                demo => {
                    if (demo.name.includes(searchTerm)) {
                        return true
                    }

                    return false
                }
            )
            // append to output if there are any
            if (matchingDemos.length) {
                output[categ] = matchingDemos
            }
        }
        // sort categs
        output = Object.fromEntries(
            Object.entries(output).toSorted(
                ([keyA, valA], [keyB, valB]) => {
                    // force "Featured" to the front
                    if (keyA === "Featured") {
                        return -1
                    }
                    // force "Other" to the end
                    if (keyA === "Other") {
                        return 1
                    }
                }
            )
        )
        
        return output
    }
</script>

<div class=content>
    <div class=projects-list-panel>
        <input 
            type="search" 
            class=search-bar
            placeholder={translate("Search demos...")}
            bind:value={searchTerm} 
        />
        <div class=projects-list>
            {#await requestDemos}
                {translate(
                    "Loading demos..."
                )}
            {:then demos}
                {@const filteredDemos = searchDemos(demos)}
                {#each Object.keys(filteredDemos) as categ}
                    <PanelButton
                        label={categ}
                        open={categ === "Featured"}
                    >
                        <div class=card-array>
                            {#each filteredDemos[categ] as demo}
                                <button 
                                    class=project-card
                                    onclick={evt => selectedDemo = demo.pathWithNamespace}
                                >
                                    <h4>{demo.name.replaceAll("_", " ")}</h4>
                                    {demo.pathWithNamespace.replaceAll("/", " / ")}
                                </button>
                            {/each}
                        </div>
                    </PanelButton>
                {/each}
            {/await}
        </div>
    </div>
    <div class=project-panel>
        {#if selectedDemo}
            <ProjectPanel 
                bind:project={selectedDemo}
            />
        {/if}
    </div>
</div>

<style>
    .content {
        display: flex;
        flex-direction: row;
        padding: 1rem;
        gap: 1rem;
        height: 100%;
        box-sizing: border-box;
    }
    .projects-list-panel {
        display: flex;
        flex-direction: column;
        gap: .5rem;
        width: 30rem;
    }

    .project-panel {
        width: 45rem;
        padding: 2rem;
        background-color: var(--base);
        border: 1px solid var(--overlay);
        border-radius: .5rem;
    }

    .projects-list {
        display: flex;
        flex-direction: column;
        overflow-y: auto;
        padding: .5rem;
    }
    .card-array {
        display: flex;
        flex-direction: column;
        gap: .5rem;
    }
    .project-card {
        display: flex;
        flex-direction: column;
        text-align: left;
        background-color: var(--base);
        border: 1px solid var(--overlay);
        border-radius: .5rem;
        padding: 1rem;
        overflow-y: auto;
        transition: border-color .2s, box-shadow .2s, background-color .2s, color .2s;
        box-shadow: 
            inset -1px -1px 2px rgba(0, 0, 0, 0.025)
        ;
    }
    .project-card:disabled {
        opacity: 50%;
    }
    .project-card:hover,
    .project-card:focus {
        outline: none;
        border-color: var(--blue);
        box-shadow: 
            inset 1px 1px 10px rgba(0, 0, 0, 0.05)
        ;
    }
    .project-card h3 {
        overflow-x: auto;
        white-space: wrap;
        width: 100%;
    }
</style>