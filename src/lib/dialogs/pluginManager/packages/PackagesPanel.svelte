<script>
    import PackageItem from "./PackageItem.svelte";
    import { ListDetail, ListDetailCategory, ListDetailItem } from "$lib/ui/listdetail";
    import { SearchCtrl } from "$lib/ui/input";
    import { python } from "$lib/globals.svelte";
    import { translate } from "$lib/translation"

    let {
        venv=$bindable()
    } = $props()

    // packages installed in the current venv, by name
    let installed = $state({})

    $effect(() => {
        if (venv) {
            python.venv.getPackages(venv).then(packages => installed = packages)
        }
    })

    // keep track of search term so we can do some manual searching via url
    let searchTerm = $state.raw("");

    function checkPyPi(term) {
        let promise = Promise.withResolvers()

        fetch(`https://pypi.org/pypi/${term}/json`)
        .then(
            resp => resp.ok ? resp.json().then(data => promise.resolve(data)) : promise.reject(resp.status)
        )

        return promise.promise
    }
</script>

<ListDetail
    filter={(params, data) => data.name.toLowerCase().includes(params.searchTerm.toLowerCase()) || params.searchTerm === ""}
>
    {#snippet ctrls(params)}
        <SearchCtrl 
            bind:value={params.searchTerm}
            placeholder={translate("Search packages...")}
            debounce=500
        />
    {/snippet}

    <ListDetailCategory
        label={translate("Installed")}
        open
    >
        {#each Object.keys(installed).filter(key => installed[key]) as name (name)}
            <ListDetailItem
                label={name}
                data={{
                    name: name
                }}
            >
                <PackageItem
                    name={name}
                    bind:installed={installed[name]}
                    bind:venv={venv}
                    getProfile={name => python.venv.getPackageDetails(venv, name)}
                />
            </ListDetailItem>
        {/each}
    </ListDetailCategory>
    
    <!-- if search matches a pypi package, include that too -->
    <ListDetailCategory
        label={translate("Not installed")}
        open
    >
        {#if searchTerm && !Object.entries(installed).some(
            ([key, val]) => val && key.toLowerCase() === searchTerm.toLowerCase()
        )}
            {#await checkPyPi(searchTerm).then(resp => resp).catch(err => undefined)}
                {translate("Searching PyPi...")}
            {:then profile}
                {#if profile?.info?.name}
                    <ListDetailItem
                        label={profile.info.name}
                        data={{
                            name: profile.info.name
                        }}
                    >
                        <PackageItem
                            name={profile.info.name}
                            bind:installed={installed[profile.info.name]}
                            bind:venv={venv}
                            getProfile={name => profile}
                        />
                    </ListDetailItem>
                {/if}
            {:catch err}
                {translate("Failed to get packages")}
                <pre>{err}</pre>
            {/await}
        {/if}
    </ListDetailCategory>
</ListDetail>
