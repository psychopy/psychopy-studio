<script>
    import { setContext } from "svelte";
    import { current } from "./globals.svelte";
    import Theme from "$lib/utils/Theme.svelte";
    import CoderRibbon from "./ribbon/Ribbon.svelte";
    import { Shortcuts } from '$lib/utils/shortcuts';
    import callbacks from "./callbacks.svelte";
    import { CoderNotebook } from "./notebook";
    import Frame from "$lib/ui/Frame.svelte";
    import Panel from "$lib/ui/Panel.svelte";
    import { PaneGroup, Pane, PaneResizer } from "paneforge";
    import { Notebook, NotebookPage } from "$lib/ui/notebook";
    import ShellNotebook from "./shell/ShellNotebook.svelte";
    import FileExplorer from "./files/FileExplorer.svelte";
    import OutlinePanel from "./outline/OutlinePanel.svelte";
    import { electron, python } from "$lib/globals.svelte";
    import SetupPython from "$lib/python/SetupPython.svelte";
    import TipsDialog from '$lib/dialogs/tips/TipsDialog.svelte';
    import { translate } from "$lib/translation";
    

    // reference current in context for ease of access
    setContext("current", current)

    // parse url params
    let params = new URLSearchParams(location.search)
    // if given a file to open, open it
    if (params.get("fileOpen")) {
        params.get("fileOpen").split(",").forEach(
            item => current.openFile(item)
        )
    }

    // listen for messages from other windows
    if (electron) {
        // for opening files via another window
        electron.windows.listen("fileOpen", (evt, file) => current.openFile(file))
        // mark ready
        electron.windows.emit("ready", true)
    }

    // keep app state up to date with open files
    if (electron) {
        $effect(() => {
            electron.state.updateFrame(
                {
                    files: Object.values(current.pages).map(page => page.file?.file)
                }
            )
        })
    }

</script>

<title>{translate("PsychoPy Coder")}</title>
<Frame
    onFileDrop={(evt, file) => current.openFile(file)}
    data-testid=coder
>
    {#snippet ribbon()}
        <CoderRibbon />
    {/snippet}
    
    <PaneGroup direction="horizontal">
        {#if electron}
            <Pane defaultSize={1/6}>
                <Panel 
                    title={translate("Navigation")}
                >
                    <Notebook>
                        <NotebookPage
                            label={translate("Files")}
                            bind:selected={
                                () => current.navigationtab === "files",
                                (val) => {
                                    if (val) {
                                        current.navigationtab = "files"
                                    }
                                }
                            }
                        >
                            <FileExplorer />
                        </NotebookPage>
                        <NotebookPage
                            label={translate("Outline")}
                            bind:selected={
                                () => current.navigationtab === "outline",
                                (val) => {
                                    if (val) {
                                        current.navigationtab = "outline"
                                    }
                                }
                            }
                        >
                            <OutlinePanel />
                        </NotebookPage>
                    </Notebook>
                </Panel>
            </Pane>
        {/if}

        <PaneResizer style="width: .3rem;"/>

        <Pane defaultSize={5/6}>

            <PaneGroup direction="vertical">
                <Pane defaultSize={3/4}>
                    <Panel 
                        title={translate("Editor")}
                    >
                        <CoderNotebook />
                    </Panel>
                </Pane>

                <PaneResizer style="height: .3rem;"/>

                {#if python?.ready}
                    <Pane defaultSize={1/4}>
                        <Panel 
                            title={translate("Console")}
                        >
                            <ShellNotebook />
                        </Panel>
                    </Pane>
                {/if}
            </PaneGroup>
        </Pane>
    </PaneGroup>
    
    

    <TipsDialog 
        categories={["general", "coder", "silly"]}
        bind:shown={current.tip.shown}
    />

    <!-- this will setup themeing -->
    <Theme />
    <!-- this will setup keyboard shortcuts -->
    <Shortcuts
        {callbacks}
    />
    <!-- this will setup a Python instance -->
    <SetupPython />
</Frame>
