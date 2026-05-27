<script>
    import PluginItem from "./PluginItem.svelte";
    import { electron, python } from "$lib/globals.svelte";
    import { onMount, setContext, untrack } from "svelte";
    import { translate } from "$lib/translation";

    let {
        venv=$bindable()
    } = $props()

    let children = $state({
        selected: undefined,
        installed: {},
        all: []
    });
    setContext("siblings", children)

    $effect(() => {
        if (venv) {
            python.venv.getPackages(venv).then(
                resp => children.installed = resp
            )
        }
    })

    let searchterm = $state.raw("");

    function matches(term, profile) {
        return (
            profile.name.toLowerCase().includes(term.toLowerCase()) ||
            profile.pipname.toLowerCase().includes(term.toLowerCase()) || 
            profile.description.toLowerCase().includes(term.toLowerCase()) || 
            profile.keywords.includes(term) ||
            term === ""
        )
    }

</script>


    <div class=plugins-ctrl>
        <div class=plugin-list-ctrl>
            <input type=search bind:value={searchterm} />
            <div class=plugins-list>
                {#await fetch("/api/plugins").then(resp => resp.json())}
                    <div class=message>{translate("Getting plugins...")}</div>
                {:then plugins}
                    {#each plugins.sort(
                        // installed packages at the top
                        (x, y) => +Object.keys(children.installed).includes(y.pipname) - +Object.keys(children.installed).includes(x.pipname)
                    ) as profile}
                        {#if matches(searchterm, profile)}
                            <PluginItem 
                                plugin={profile} 
                                bind:venv={venv} 
                            />
                        {/if}
                    {/each}
                {:catch err}
                    <div class=message>
                        {translate("Failed to get plugins")}
                    </div>
                    <pre>{err}</pre>
                {/await}
            </div>
        </div>
        <div class=selected-plugin>
            {@render children.selected?.()}
        </div>
    </div>


<style>
    .message {
        width: 45rem;
        padding: 1rem;
    }

    .plugins-ctrl {
        position: relative;
        display: flex;
        flex-direction: row;
        height: 100%;
        gap: 1rem;
        padding: 1rem;
        box-sizing: border-box;
    }

    .plugin-list-ctrl {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        width: 30rem;
    }

    .plugins-list, .selected-plugin {
        padding: .5rem;
        overflow-y: auto;
    }

    .plugins-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }
</style>