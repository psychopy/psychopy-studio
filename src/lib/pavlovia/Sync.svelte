<script>
    import { git } from "$lib/globals.svelte";
    import { showWindow } from "$lib/utils/views.svelte";
    import { getContext } from "svelte";
    import CommitDlg from "./CommitDlg.svelte";
    import NewProjectDlg from "./NewProjectDlg.svelte";

    let current = getContext("current");

    let {
        /** @interface */
        button
    } = $props()

    let changes = $state.raw()

    export async function sync(folder, user) {
        let sha
        // get project name for marking start/end of sync in output
        let name = folder.split(/[\\/]/).filter(Boolean).pop()
        // open runner to capture output (but don't focus it)
        showWindow("runner", false)
        // mark started
        git.output(`--- Started sync ${name} ---`)
        try {
            // if indicated in exp settings, compile JS
            if (current.experiment?.settings?.params?.['exportHTML'].val === "on Sync") {
                await current.experiment.writeScript("PsychoJS")
            }
            // get remote
            let remote = await git.getRemote(folder, user);
            // if there is no remote, create one
            if (remote === null) {
                // prompt to create one
                show.newProject = true;
                if (await awaiting.newProject.promise) {
                    // if completed, get details
                    remote = await git.getRemote(folder, user);
                } else {
                    // if cancelled, return
                    git.output(`--- Cancelled sync ${name} ---`)
                    return
                }
            }
            // pull from remote
            await git.pull(folder, user)
            // scan for local changes
            changes = await git.check(folder)
            // commit any changes
            if (changes.length) {
                // prompt to commit
                show.commit = true;
                // wait until either given a commit, or told to cancel
                try {
                    sha = await awaiting.commit.promise;
                } catch {
                    // if cancelled, abort sync
                    git.output(`--- Cancelled sync ${name} ---`)
                    return
                }
            }
            // push changes (if any)
            await git.push(folder, user)
        } catch (err) {
            // mark failed (then let error carry on as before)
            git.output(`--- Failed sync ${name} ---`)
            throw err
        }
        // focus runner
        showWindow("runner", true)
        // mark finished
        git.output(`--- Finished sync ${name} ---`)

        return sha
    }

    let show = $state({
        newProject: false,
        commit: false
    })
    let awaiting = $state({
        newProject: Promise.withResolvers(),
        commit: Promise.withResolvers()
    })
</script>

{@render button(sync)}

<NewProjectDlg 
    bind:shown={show.newProject}
    bind:awaiting={awaiting.newProject}
/>
<CommitDlg 
    bind:shown={show.commit}
    bind:awaiting={awaiting.commit}
    bind:changes={changes}
/>