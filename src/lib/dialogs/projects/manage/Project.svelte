<script>
    import { CompactButton } from "$lib/utils/buttons";
    import { projects } from "$lib/globals.svelte";
    import { translate } from "$lib/translation";

    let {
        project
    } = $props()
</script>

<div
    class=local-project
>
    <div class=project-header>  
        <h3>{project.id}</h3>
        <CompactButton
            icon="/icons/btn-delete.svg"
            onclick={(evt) => delete projects[project.id]}
        />
    </div>  
    <div>{translate("Local folder:")}</div>
    <input bind:value={project.localRoot} />
    
</div>

<style>
    h3 {
        margin: 0;
    }
    .project-header {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
    }
    .local-project {
        padding: 1rem;
        background-color: var(--base);
        border: 1px solid var(--overlay);
        border-radius: .5rem;
        display: flex;
        flex-direction: column;
        gap: .5rem;
    }
</style>