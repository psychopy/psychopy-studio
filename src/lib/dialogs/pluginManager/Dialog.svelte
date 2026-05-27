<script>
    import { Notebook, NotebookPage } from "$lib/utils/notebook";
    import { Dialog } from "$lib/utils/dialog";
    import PluginsPanel from "./plugins/PluginsPanel.svelte";
    import PackagesPanel from "./packages/PackagesPanel.svelte";
    import VenvChooser from "./VenvChooser.svelte";
    import { python } from "$lib/globals.svelte"
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
    id=plugin-mgr
    title={translate("Plugins & packages")}
    buttons={{
        OK: evt => {}
    }}
    bind:shown={shown}
>
    <div class=container>
        <div class=environment-ctrl>
            Python environment:
            <VenvChooser 
                bind:value={venv}
            />
        </div>

        <Notebook>

            <NotebookPage
                label="Plugins"
                bind:selected={
                    () => pages.current === "plugins",
                    value => pages.current = "plugins"
                }
            >
                <PluginsPanel bind:venv={venv} />
            </NotebookPage>
            <NotebookPage
                label="Packages"
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
        flex-direction: column;
        height: 100%;
        width: 100%;
        gap: 1rem;
        padding: 1rem;
        box-sizing: border-box;
        align-items: stretch;
    }
    .environment-ctrl {
        display: flex;
        flex-direction: column;
    }
</style>