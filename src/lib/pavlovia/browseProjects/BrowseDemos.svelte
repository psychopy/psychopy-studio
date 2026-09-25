<script>
    import ProjectCard from "./ProjectCard.svelte";
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
    <input 
        type="search" 
        class=search-bar
        placeholder={translate("Search demos...")}
        bind:value={searchTerm} 
    />
    {#await requestDemos then demos}
        {@const filteredDemos = searchDemos(demos)}
        {#each Object.keys(filteredDemos) as categ}
        <PanelButton
            open
        >
            {#snippet label()}
                <h2>{categ}</h2>
            {/snippet}
            <div class=card-array>
                {#each filteredDemos[categ] as demo}
                    <ProjectCard 
                        demo={demo} 
                    />
                {/each}
            </div>
        </PanelButton>
        {/each}
    {/await}
</div>

<style>
    .content {
        display: flex;
        flex-direction: column;
        padding: 1rem;
        width: 60rem;
    }
    .card-array {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr 1fr;
        gap: .5rem;
    }
</style>