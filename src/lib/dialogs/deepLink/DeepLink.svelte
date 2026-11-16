<script>
    import { translate } from "$lib/translation";
    import { Dialog } from "$lib/ui/dialog";
    import { getContext } from "svelte";
    import ProjectPanel from "$lib/pavlovia/ProjectPanel.svelte";

    let {
        project,
        shown=$bindable()
    } = $props();

    let current = getContext("current");
</script>

<Dialog
    title={translate("Opening {}...").replace("{}", project)}
    bind:shown={shown}
    shrink
>
    <div class=container>
        <ProjectPanel 
            project={project}
        />
    </div>
</Dialog>

<style>
    .container {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        align-items: start;
        margin: 1rem;
        padding: 1rem;
        width: 45rem;
        background-color: var(--base);
        border: 1px solid var(--overlay);
        border-radius: .5rem;
    }
</style>