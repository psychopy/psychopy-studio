<script>
    import { git } from "$lib/globals.svelte";
    import { showWindow } from "$lib/utils/views.svelte";
    import { getContext } from "svelte";
    import { findProject } from "./pavlovia.svelte";
    import CommitDlg from "./CommitDlg.svelte";
    import NewProjectDlg from "./NewProjectDlg.svelte";

    let current = getContext("current");

    let {
        /** @interface */
        button
    } = $props()


    export async function sync(folder, user, force=false) {
        let sha
        // if indicated in exp settings, compile JS
        if (current.experiment?.settings?.params?.['exportHTML'].val === "on Sync") {
            await current.experiment.writeScript("PsychoJS")
        }
        // get remote
        let remote = await git.getRemote(folder, user);
        // open runner to capture output (but don't focus it)
        showWindow("runner", false)
        // if there is no remote, create one
        if (remote === null) {
            // prompt to create one
            show.newProject = true;
            if (await awaiting.newProject.promise) {
                // if completed, get details
                remote = await git.getRemote(folder, user);
            } else {
                // if cancelled, return
                git.output("Cancelled by user.")
                return
            }
        }
        // pull from remote
        await git.pull(folder, user, false)
        // scan for local changes
        let changes = await git.stage(folder)
        // stage any changes
        if (changes.length) {
            // prompt to commit
            show.commit = true;
            // wait until either given a commit, or told to cancel
            try {
                sha = await awaiting.commit.promise;
            } catch {
                // if cancelled, abort sync
                git.output("Cancelled by user.")
                return
            }
            // push changes
            await git.push(folder, user, force)
        } else {
            // explain failure
            git.output("Nothing to push.")
        }
        // focus runner
        showWindow("runner", true)
        git.output(`Finished sync`)

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
/>