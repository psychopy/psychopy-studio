<script>
    import { Notebook, NotebookPage, ButtonTab } from "$lib/utils/notebook";
    import { python } from "$lib/globals.svelte";
    import Shell from "./Shell.svelte";
    import StdoutOutput from "./StdoutOutput.svelte";
    import { translate } from "$lib/translation";
    import { getContext } from "svelte";

    let shells = $state({});
    let current = getContext("current");
    
    // start off with one shell
    python.shell.open("app").then(
        id => {
            shells[id] = "Python";
            current.shelltab = id;
        }
    );
</script>


<Notebook>
    <NotebookPage
        label={translate("Stdout")}
        bind:selected={
            () => current.shelltab === "stdout",
            (value) => {
                if (value) {
                    current.shelltab = "stdout"
                }
            }
        }
    >
        <StdoutOutput />
    </NotebookPage>
    {#each Object.entries(shells) as [id, label]}
        <NotebookPage
            label={label}
            close={(evt) => {
                python.shell.close("app", id)
                delete shells[id]
            }}
            bind:selected={
                () => current.shelltab === id,
                (value) => {
                    if (value) {
                        current.shelltab = id
                    }
                }
            }
        >
            <Shell id={id} />
        </NotebookPage>
    {/each}
    <ButtonTab 
        callback={async evt => shells[await python.shell.open("app")] = "Python"}
    />
</Notebook>