<script>
    import Panel from '$lib/utils/Panel.svelte';
    import Frame from '$lib/utils/Frame.svelte';
    import { PaneGroup, Pane, PaneResizer } from "paneforge";
    import Theme from "$lib/utils/Theme.svelte";
    import Shortcuts from '$lib/utils/Shortcuts.svelte';
    import { shortcuts } from "./callbacks.svelte";
    import Ribbon from './ribbon/Ribbon.svelte';
    import RoutinesNotebook from './routines/Notebook.svelte';
    import ComponentsPanel from './components/Panel.svelte';
    import FlowPanel from './flow/Panel.svelte';
    import { current } from "./globals.svelte.js";
    import { setContext } from 'svelte';
    import { electron } from "$lib/globals.svelte";
    import { SetupPython, PythonErrors } from '$lib/python';
    import ReadMe from '$lib/dialogs/readme/ReadMe.svelte';
    import {
        openFile
    } from "./callbacks.svelte";
    import { python } from "$lib/globals.svelte";
    import TipsDialog from '../../lib/dialogs/tips/TipsDialog.svelte';
    import { updateLocale, translate } from "$lib/translation";

    // parse url params
    let params = new URLSearchParams(location.search)
    // if given a file to open, open it
    if (params.get("fileOpen")) {
        params.get("fileOpen").split(",").forEach(
            item => openFile(item)
        )
    }

    // reference current in context for ease of access
    setContext("current", current)
    // listen for messages from other windows
    if (electron) {
        // for opening files via another window
        electron.windows.listen("fileOpen", (evt, file) => openFile(file))
        // mark ready
        electron.windows.emit("ready", true)
    }

    $effect(updateLocale)

    // keep app state up to date with open files
    if (electron) {
        $effect(() => {
            electron.state.updateFrame(
                {
                    files: [current.experiment?.file?.file]
                }
            )
        })
    }
</script>

{#if current.experiment.file}
    <title>{translate("PsychoPy Builder")}: {current.experiment.file?.name}</title>
{:else}
    <title>{translate("PsychoPy Builder")}</title>
{/if}

<Frame
    onFileDrop={(evt, file) => openFile(file)}
>
    {#snippet ribbon()}
        <Ribbon />
    {/snippet}
    <PaneGroup direction="vertical">
        <Pane defaultSize={2/3}>
            <PaneGroup direction="horizontal">
                <Pane defaultSize={3/4}>
                    <Panel 
                        title={translate("Routines")} 
                    >
                        <RoutinesNotebook />
                    </Panel>
                </Pane>
                
                <PaneResizer style="width: .3rem;"/>

                <Pane defaultSize={1/4}>
                    <Panel 
                        title={translate("Components")} 
                    >
                        <ComponentsPanel />
                    </Panel>
                </Pane>
            </PaneGroup>
        </Pane>

        <PaneResizer style="height: .3rem;" />

        <Pane defaultSize={1/3}>
            <Panel 
                title={translate("Flow")} 
                hspan={4}
            >
                <FlowPanel />
            </Panel>
        </Pane>
    </PaneGroup>

    <ReadMe 
        script={current.readme.script}
        bind:shown={current.readme.shown}
    />
    <TipsDialog 
        categories={["general", "builder", "silly"]}
        bind:shown={current.tip.shown}
    />
    <!-- this will setup themeing -->
    <Theme />
    <!-- this will setup keyboard shortcuts -->
    <Shortcuts
        callbacks={shortcuts}
    />
    <!-- this will setup a Python instance -->
    {#if python}
        <SetupPython />
        <PythonErrors 
            bind:enabled={current.errorPopups}
        />
    {/if}

</Frame>

<style>
    :global(#routine-pnl) {
        grid-column-end: span 2;
        grid-row-end: span 2;
    }
    :global(#components-pnl) {
        grid-column-end: span 1;
        grid-row-end: span 2;
        background-color: var(--mantle);
    }
    :global(#flow-pnl) {
        grid-column-end: span 3;
        grid-row-end: span 1;
        background-color: var(--mantle);
    }
</style>