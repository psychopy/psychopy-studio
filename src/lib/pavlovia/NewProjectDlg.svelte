<script>
    import { Dialog } from "$lib/utils/dialog";
    import { git } from "$lib/globals.svelte";
    import { getContext } from "svelte";
    import { translate } from "$lib/translation";

    let {
        shown=$bindable(),
        awaiting=$bindable()
    } = $props()

    let current = getContext("current");

    let details = $state({
        name: undefined,
        group: undefined,
    })
</script>

<Dialog 
    title={translate("New project")}
    buttons={{
        OK: async evt => {
            // create a new project
            await git.newProject(
                $state.snapshot(details), 
                current.experiment.file.parent, 
                $state.snapshot(current.user)
            )
            // set current project to this new one
            current.project = await git.getProjectInfo(
                { folder: current.experiment.file.parent }, 
                $state.snapshot(current.user)
            )
            // mark finished
            awaiting.resolve(true)
        },
        CANCEL: evt => awaiting.resolve(false)
    }}
    onopen={evt => {
        details.name = current.experiment.file.stem
        details.group = $state.snapshot(current.user)
        // refresh promise
        let newPromise = Promise.withResolvers();
        awaiting.resolve(newPromise.promise);
        awaiting = newPromise;
    }}
    bind:shown={shown}
    shrink
>
    <div class=content>
        <div class=ctrl>
            pavlovia.org / 
            <select bind:value={details.group} style:flex-grow=1>
                <option value={current.user}>{current.user}</option>
                {#await git.listGroups($state.snapshot(current.user)) then groups}
                    {#each groups as group}
                        <option value={group.path}>{group.path}</option>
                    {/each}
                {/await}
            </select>
            /
            <input bind:value={details.name} />
        </div>
    </div>
</Dialog>

<style>
    .content {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding: 1rem;
        min-width: 35rem;
    }
    .ctrl {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: .5rem;
    }
</style>