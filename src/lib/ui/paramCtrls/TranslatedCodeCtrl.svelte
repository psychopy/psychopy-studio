<script>
    import ParamCtrl from "./ParamCtrl.svelte";
    import { PaneGroup, Pane, PaneResizer } from "paneforge";
    import { python } from "$lib/globals.svelte";
    import { translate } from "$lib/translation";

    let {
        codeTypeParam=$bindable(),
        pyParam=$bindable(),
        jsParam=$bindable(),
    } = $props()

    // translate to JS if code type indicates as such
    $effect(() => {
        // skip if not autotranslating
        if (codeTypeParam.val !== "Auto->JS") {
            return
        }
        // skip if python isn't ready yet
        if (!python?.ready) {
            return
        }
        // start off just saying "Translating..."
        jsParam.val = `// ${translate("Translating...")}`
        // do translation in Python
        python.liaison.send("app", {
            command: "try",
            args: [
                "psychopy.experiment.py2js_transpiler:translatePythonToJavaScript", 
                pyParam.val.trim(), 
                null
            ]
        }, 10000).then(resp => {
            if (resp.success) {
                jsParam.val = resp.result
            } else {
                jsParam.val = `// ${translate("Error in Python code")}`
            }
        }).catch(
            err => jsParam.val = `// ${translate("Error in Python code")}`
        )
    })
</script>


{#if codeTypeParam.val === "Py"}
    <ParamCtrl 
        name={pyParam.name} 
        bind:param={pyParam}
    />
{:else if codeTypeParam.val === "JS"}
    <ParamCtrl 
        name={jsParam.name} 
        bind:param={jsParam}
    />
{:else}
    <PaneGroup direction="horizontal">
        <Pane defaultSize={1/2}>
            <div class=container
            >
                <ParamCtrl 
                    name={pyParam.name} 
                    bind:param={pyParam}
                />
            </div>
        </Pane>
        <PaneResizer style="width: .3rem;" />
        <Pane defaultSize={1/2}>
            <div class=container>
                <ParamCtrl 
                    name={jsParam.name} 
                    bind:param={jsParam}
                />
            </div>
        </Pane>
    </PaneGroup>
{/if}


<style>
    .container {
        display: flex;
        height: 100%;
    }
</style>