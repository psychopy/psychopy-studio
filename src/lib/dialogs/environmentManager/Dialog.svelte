<script>
    import { Notebook, NotebookPage } from "$lib/ui/notebook";
    import { Dialog } from "$lib/ui/dialog";
    import PluginsPanel from "./plugins/PluginsPanel.svelte";
    import PackagesPanel from "./packages/PackagesPanel.svelte";
    import EnvironmentsPanel from "./environments/EnvironmentsPanel.svelte";
    import { translate } from "$lib/translation";

    let {
        shown=$bindable()
    } = $props();

    let pages = $state({
        current: undefined
    });

    let venv = $state.raw("app")
</script>


<Dialog
    data-testid=plugin-mgr
    title={translate("Plugins & packages")}
    bind:shown={shown}
    buttons={["OK"]}
>
    <div class=container>
        <EnvironmentsPanel 
            bind:value={venv}
        />

        <Notebook>
            <NotebookPage
                label={translate("Plugins")}
                initial
                bind:selected={
                    () => pages.current === "plugins",
                    value => pages.current = "plugins"
                }
            >
                <PluginsPanel bind:venv={venv} />
            </NotebookPage>
            <NotebookPage
                label={translate("Packages")}
                bind:selected={
                    () => pages.current === "packages",
                    value => pages.current = "packages"
                }
            >
                <PackagesPanel bind:venv={venv} />
            </NotebookPage>
        </Notebook>
    </div>
</Dialog>

<style>
    .container {
        display: flex;
        flex-direction: row;
        height: 100%;
        width: 100%;
        gap: 1rem;
        padding: 1rem;
        box-sizing: border-box;
        align-items: stretch;
    }
</style>