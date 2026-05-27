<script>
    import { Notebook, NotebookPage, ButtonTab } from "$lib/utils/notebook";
    import { python } from "$lib/globals.svelte";
    import Shell from "./Shell.svelte";

    let shells = $state({})

    // start off with a Python shell
    let currentTab = $state.raw();
    
    // start off with one shell
    python.shell.open("app").then(
        id => {
            shells[id] = "Python";
            currentTab = id;
        }
    );
</script>


<Notebook>
    {#each Object.entries(shells) as [id, label]}
        <NotebookPage
            label={label}
            close={(evt) => {
                python.shell.close("app", id)
                delete shells[id]
            }}
            bind:selected={
                () => currentTab === id,
                (value) => {
                    if (value) {
                        currentTab = id
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