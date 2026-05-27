<script>
    import { Notebook, NotebookPage } from "$lib/utils/notebook";
    import { showWindow } from "$lib/utils/views.svelte";
    import { DeepLink } from "$lib/dialogs/deepLink";
    import Frame from "$lib/utils/Frame.svelte";
    import Panel from "$lib/utils/Panel.svelte";
    import { PaneGroup, Pane, PaneResizer } from "paneforge";
    import Theme from "$lib/utils/Theme.svelte";
    import AlertsOutput from "./outputs/AlertsOutput.svelte";
    import FilesPanel from "./files/Panel.svelte";
    import { current } from "./globals.svelte";
    import { setContext } from "svelte";
    import StdoutOutput from "./outputs/StdoutOutput.svelte";
    import PavloviaOutput from "./outputs/PavloviaOutput.svelte";
    import { electron, python, git } from "$lib/globals.svelte";
    import SetupPython from "../../lib/python/SetupPython.svelte";
    import { addFile } from "./callbacks.svelte";
    import Ribbon from "./ribbon/Ribbon.svelte";
    import Shortcuts from '$lib/utils/Shortcuts.svelte';
    import { shortcuts } from "./callbacks.svelte";
    import TipsDialog from '$lib/dialogs/tips/TipsDialog.svelte';
    import { updateLocale, translate } from "$lib/translation"
    

    setContext("current", current)

    // parse url params
    let params = new URLSearchParams(location.search)
    // if given a file to open, open it
    if (params.get("fileOpen")) {
        params.get("fileOpen").split(",").forEach(
            item => addFile(item)
        )
    }
    
    // listen for messages from other windows
    if (electron) {
        // for opening files via another window
        electron.windows.listen("fileOpen", (evt, file) => addFile(file))
        // mark ready
        electron.windows.emit("ready", true)
    }

    // setup listener for alerts
    python.liaison.listen("alert", 
        (evt, message) => {
            // if this code isn't already in the panel, add it
            if (!current.output.alerts.some(
                item => item.code === message.message.code
            )) {
                current.output.alerts.push(message.message);
                // focus runner and switch to alerts tab
                showWindow("runner", true)
                current.tab = "alerts";
            }
        }
    )
    // setup listeners for stdout
    python.output.stdout.listen(
        (evt, message) => current.output.stdout += `${message}\n`
    )
    python.output.stderr.listen(
        (evt, message) => {
            current.output.stdout += `${message}\n`;
            // focus runner and switch to stdout tab
            showWindow("runner", true)
            current.tab = "stdout";
        }
    )
    python.liaison.listen("error",
        (evt, message) => {
            current.output.stdout += `${message.error}\n`;
            // focus runner and switch to stdout tab
            showWindow("runner", true)
            current.tab = "stdout";
        }
    )
    // setup listener for pavlovia
    git.listen(
        (evt, message) => {
            current.output.pavlovia += message + "\n";
            // focus runner and switch to pavlovia tab
            showWindow("runner", true)
            current.tab = "pavlovia";
        }
    )

    $effect(updateLocale)

    // keep app state up to date with open files
    if (electron) {
        $effect(() => {
            electron.state.updateFrame(
                {
                    files: Object.values(current.runlist).map(item => item.file?.file)
                }
            )
        })
    }
</script>


{#if current.runlist[current.selection]?.file?.name}
    <title>{translate("PsychoPy Runner")}: {current.runlist[current.selection].file.name}</title>
{:else}
    <title>{translate("PsychoPy Runner")}</title>
{/if}
<Frame
    onFileDrop={(evt, file) => addFile(file)}
>
    {#snippet ribbon()}
        <Ribbon />
    {/snippet}

    <PaneGroup direction="horizontal">
        <Pane defaultSize={1/3}>
            <Panel
                title=Files
                hspan={1}
                vspan={1}
            >
                <FilesPanel />
            </Panel>
        </Pane>

        <PaneResizer style="width: .3rem;"/>

        <Pane defaultSize={2/3}>
            <Panel
                title=Output 
                hspan={2}
                vspan={1}
            >
                <Notebook>
                    <NotebookPage
                        label=Alerts
                        bind:selected={
                            () => current.tab === "alerts",
                            (val) => {
                                if (val) {
                                    current.tab = "alerts"
                                }
                            }
                        }
                    >
                        <AlertsOutput />
                    </NotebookPage>
                    <NotebookPage
                        label=Stdout
                        bind:selected={
                            () => current.tab === "stdout",
                            (val) => {
                                if (val) {
                                    current.tab = "stdout"
                                }
                            }
                        }
                    >
                        <StdoutOutput />
                    </NotebookPage>
                    <NotebookPage
                        label=Pavlovia
                        bind:selected={
                            () => current.tab === "pavlovia",
                            (val) => {
                                if (val) {
                                    current.tab = "pavlovia"
                                }
                            }
                        }
                    >
                        <PavloviaOutput />
                    </NotebookPage>
                </Notebook>
            </Panel>
        </Pane>
    </PaneGroup>

    <TipsDialog 
        categories={["general", "runner", "silly"]}
        bind:shown={current.tip.shown}
    />

    <!-- this will setup themeing -->
    <Theme />
    <!-- this will setup keyboard shortcuts -->
    <Shortcuts
        callbacks={shortcuts}
    />
    <!-- this will setup a Python instance -->
    <SetupPython />
    <!-- this will handle opening Pavlovia projects from a URI -->
    <DeepLink 
        project={params.get("projectOpen")}
    />
</Frame>
