<script>
    import ProjectPanel from "../ProjectPanel.svelte";
    import { ListDetail, ListDetailItem, ListDetailCategory } from "$lib/ui/listdetail";
    import { SearchCtrl } from "$lib/ui/input";
    import { translate } from "$lib/translation";

    let {
        selection=$bindable(),
        params=$bindable()
    } = $props()

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
</script>

<ListDetail
    filter={(params, data) => data.name.includes(params.searchTerm || "")}
    bind:params={params}
>
    {#snippet ctrls(params)}
        <SearchCtrl 
            bind:value={params.searchTerm}
            placeholder={translate("Search demos...")}
        />
    {/snippet}

    {#await requestDemos}
        {translate(
            "Loading demos..."
        )}
    {:then demos}
        {#each Object.entries(demos).toSorted(
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
        ) as [categ, items]}
            <ListDetailCategory
                label={categ}
                open={categ === "Featured"}
            >
                {#each items as demo}
                    <ListDetailItem 
                        data={demo}
                        bind:selected={
                            () => selection === demo.pathWithNamespace,
                            (value) => selection = value && demo.pathWithNamespace
                        }
                    >
                        {#snippet label()}
                            <h4>{demo.name.replaceAll("_", " ")}</h4>
                            {demo.pathWithNamespace.replaceAll("/", " / ")}
                        {/snippet}

                        <ProjectPanel 
                            project={demo.pathWithNamespace}
                        />
                    </ListDetailItem>
                {/each}
            </ListDetailCategory>
        {/each}
    {/await}
</ListDetail>
