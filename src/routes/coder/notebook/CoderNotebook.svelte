<script>
    import { getContext, onMount } from "svelte";
    import { ButtonTab, Notebook, NotebookPage } from "$lib/utils/notebook";
    import { CodeEditor } from "$lib/utils/code";
    import { prefs } from "$lib/preferences.svelte";
    import { Script } from "$lib/experiment";
    import { translate } from "$lib/translation";

    var media = $state({
        prefersColorScheme: "light"
    });
    onMount(() => {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
            media.prefersColorScheme = event.matches ? "dark" : "light";
        });
    })

    let current = getContext("current")
</script>

<Notebook>
    {#each Object.entries(current.pages) as [i, page]}
        <NotebookPage
            label={page.file.name}
            close={(evt) => current.pages.splice(i, 1)}
            bind:selected={
                () => current.tab === parseInt(i),
                (val) => {
                    if (val) {
                        current.tab = parseInt(i)
                    }
                }
            }
        >
            <CodeEditor
                bind:theme={prefs.params.theme.val}
                bind:value={page.content}
                bind:editor={page.editor}
                bind:canUndo={page.canUndo}
                bind:canRedo={page.canRedo}
                readonly={prefs.params['readonly'].val}
                file={page.file}
            />
        </NotebookPage>
    {/each}
    <ButtonTab
        callback={evt => current.pages.push(new Script({
            file: undefined,
            parent: undefined,
            name: "untitled.py",
            stem: "untitled",
            ext: ".py"
        }))}
        tooltip={translate("New file...")}
    />
</Notebook>