<script>
    import DeepLink from "$lib/dialogs/deepLink/DeepLink.svelte";

    let {
        demo
    } = $props()

    let showDlg = $state.raw(false)
</script>


<button 
    class=project-card
    onclick={evt => showDlg = true}
>
    <h3>{demo.name.replaceAll("_", " ")}</h3>
    <p>{demo.description}</p>
</button>
<DeepLink
    project={demo.pathWithNamespace}
    bind:shown={showDlg}
/>


<style>
    .project-card {
        display: flex;
        flex-direction: column;
        text-align: left;
        background-color: var(--base);
        border: 1px solid var(--overlay);
        border-radius: .5rem;
        width: 16rem;
        padding: 1rem;
        overflow-y: auto;
        transition: border-color .2s, box-shadow .2s, background-color .2s, color .2s;
        box-shadow: 
            inset -1px -1px 2px rgba(0, 0, 0, 0.025)
        ;
    }
    .project-card:disabled {
        opacity: 50%;
    }
    .project-card:hover,
    .project-card:focus {
        outline: none;
        border-color: var(--blue);
        box-shadow: 
            inset 1px 1px 10px rgba(0, 0, 0, 0.05)
        ;
    }
    .project-card h3 {
        overflow-x: auto;
        white-space: wrap;
        width: 100%;
    }
</style>