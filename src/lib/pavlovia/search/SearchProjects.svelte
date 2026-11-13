<script>
    import { git } from "$lib/globals.svelte";
    import ProjectPanel from "../ProjectPanel.svelte";
    import FilterDlg from "./FilterDlg.svelte";
    import { ListDetail, ListDetailItem } from "$lib/ui/listdetail";
    import { SearchCtrl } from "$lib/ui/input";
    import { ToggleButton, Button } from "$lib/ui/button";
    import { translate } from "$lib/translation";
    import { getContext } from "svelte";
    import { getDemos } from "../demos/functions.svelte";

    let {
        selection=$bindable(),
        params=$bindable()
    } = $props()

    let current = getContext("current");
    // we need (asynchronously fetched) details on the current user, so keep it updated in an effect
    let profile = $state.raw()
    $effect(() => git.getUserInfo(current.user).then(
        resp => profile = resp
    ))
    // define default search params
    if (params === undefined) {
        params = {
            searchTerm: "",
            meMode: false,
            filters: {
                designer: undefined,
                status: undefined,
                platform: undefined,
                visibility: undefined,
                keywords: undefined
            }
        }
    }
    // shorthand to check whether we have any filters
    let hasFilters = $derived(
        Object.values(params.filters).some(val => val !== undefined)
    )
    // cap results so we're not loading an insane amount of projects
    let limit = 100;
    // dynamically construct an API query to get projects
    let query = $derived.by(() => {
        // base url
        let url
        if (params.meMode && profile) {
            url = new URL(`https://pavlovia.org/api/v2/designers/${profile.id}/experiments`)
        } else {
            url = new URL("https://pavlovia.org/api/v2/experiments")
        }
        // search term
        url.searchParams.set("search", (params.filters.designer ? `^${params.filters.designer}/` : "") + params.searchTerm)
        // apply uncomplicated filters
        for (let [key, value] of Object.entries(params.filters)) {
            if (value !== undefined  && key !== "designer") {
                url.searchParams.set(key, value)
            }
        }
        // limit to n results
        url.searchParams.set("limit", limit)

        return url
    })

    let projectsPromise = $derived.by(() => {
        if (params.searchTerm || params.meMode || hasFilters) {
            // do a search if we have any search term or params
            return git.authenticate.fetch(query.toString(), current.user).then(
                resp => resp.json()
            ).then(
                resp => resp.experiments
            )
        } else {
            // show demos otherwise
            return getDemos().then(
                resp => resp.experiments
            )
        }
    })

    let show = $state({
        filterDlg: false
    })
</script>

<ListDetail
    bind:params={params}
>
    {#snippet ctrls(params)}
        <SearchCtrl 
            bind:value={params.searchTerm}
            params={params}
            placeholder={translate("Search projects...")}
            debounce=1000
        >
            {#snippet ctrls(params)}
                <ToggleButton 
                    tooltip={current.user ? translate("Only show projects belonging to you") : translate("Log in to show only projects belonging to you")}
                    icon="/icons/btn-memode.svg"
                    bind:value={params.meMode}
                    disabled={!current.user}
                    small
                />
                <Button 
                    tooltip={translate("Filter...")}
                    icon="/icons/btn-filter.svg"
                    onclick={evt => show.filterDlg = true}
                    depressed={hasFilters}
                    small
                />
            {/snippet}
        </SearchCtrl>
    {/snippet}
    {#await projectsPromise}
        {translate("Searching...")}
    {:then projects}
        {#each projects as project}
            <ListDetailItem 
                data={project}
                bind:selected={
                    () => selection === project.pathWithNamespace,
                    (value) => selection = value && project.pathWithNamespace
                }
            >
                {#snippet label()}
                    <h4>{project.name}</h4>
                    {project.pathWithNamespace.replaceAll("/", " / ")}
                {/snippet}

                <ProjectPanel 
                    project={project.pathWithNamespace}
                />
            </ListDetailItem>
        {/each}
    {/await}

</ListDetail>

<FilterDlg
    bind:filters={params.filters}
    bind:shown={show.filterDlg}
/>

<style>
    .ctrl-buttons {
        display: flex;
        flex-direction: row;
    }
    .gap {
        flex-grow: 1;
    }
</style>