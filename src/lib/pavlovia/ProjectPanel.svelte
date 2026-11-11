<script>
    import { electron, git } from "$lib/globals.svelte";
    import { MessageDialog, DialogButton } from "$lib/ui/dialog";
    import { projectsLoaded, openProject, cloneProject, forkProject, downloadProject } from "./utils.svelte"
    import { Button } from "$lib/ui/button";
    import { parsePath } from "$lib/utils/files";
    import { openIn } from "$lib/utils/views.svelte";
    import { getContext } from "svelte";
    import { marked } from "marked";
    import { translate } from "$lib/translation";
    import path from "path-browserify";

    let {
        project=$bindable()
    } = $props();

    let current = getContext("current");
    let dialog = getContext("dialog");

    let show = $state({
        forkPrompt: false
    })

    let busy = $state({
        cloning: Promise.resolve(false)
    })
</script>


{#snippet fetchCtrls(name, info)}
    {translate(
        "{} is not synced to your local machine. Would you like to fetch it from Pavlovia?"
    ).replace("{}", name)}
    <div class=button-array>
        <Button
            label="Clone"
            icon="/icons/btn-download.svg"
            onclick={async evt => {
                if (current.user === info.namespace.name) {
                    // if this is their own project, clone it
                    return await cloneProject(
                        $state.snapshot(current.user)
                    )
                } else {
                    // if not, ask if they want to fork it
                    show.forkPrompt = true
                }
            }}
            bind:awaiting={busy.cloning}
            horizontal
        />
        <MessageDialog
            title={translate("Fork project?")}
            bind:shown={show.forkPrompt}
        >
            {translate(
                "This project belongs to {}, would you like to create a fork (copy) of it on your Pavlovia account?"
            ).replaceAll("{}", info.namespace.name)}
            {#snippet buttons()}
                <DialogButton
                    action=YES
                    onclick={evt => forkProject(
                        project,
                        $state.snapshot(current.user)
                    )}
                />
                <DialogButton
                    action=NO
                    onclick={evt => cloneProject(
                        project,
                        $state.snapshot(current.user)
                    )}
                />
            {/snippet}
        </MessageDialog>
        <Button
            label="Find"
            tooltip={translate("Point to a local clone of this project")}
            icon="/icons/btn-open.svg"
            onclick={async evt => {
                openProject()
            }}
            bind:awaiting={busy.cloning}
            horizontal
        />
    </div>
{/snippet}

<!-- controls to open a synced project -->
{#snippet openCtrls(folder)}
    {translate(
        "You have this demo downloaded already, use the buttons below to open or run it."
    )}
    <div class=button-array>
        <Button 
            label={translate("Open file")}
            icon="/icons/btn-open.svg"
            onclick={evt => openProject(folder).then(
                complete => {
                    // if we're in a dialog, close it after opening
                    if (complete && dialog) {
                        dialog.shown = false
                    }
                }
            )}
            horizontal
        />
        {#await electron.files.scandir(folder, true) then files}
            {#each files.map(file => parsePath(file)) as file}
                {#if file.ext === ".psyexp"}
                    <Button 
                        label={translate("Run {}").replace("{}", file.stem)}
                        icon="/icons/btn-runpy.svg"
                        onclick={evt => {
                            openIn(path.join(folder, file.file), "runner");
                        }}
                        horizontal
                    />
                {/if}
            {/each}
        {/await}
    </div>
{/snippet}

<!-- controls to download a demo (disconnected from upstream, unlike clone) -->
{#snippet demoCtrls(name)}
    {translate(
        "Because this is a public demo, you can't sync to it, but you can download the files and create a project from it. You can also run it on Pavlovia."
    )}
    <div class=button-array>
        <Button 
            label={translate("Download files")}
            icon="/icons/btn-download.svg"
            onclick={evt => downloadProject(name, $state.snapshot(current.user))}
            horizontal
        />
        <Button 
            label={translate("Run online")}
            icon="/icons/btn-runpy.svg"
            onclick={evt => open(`https://run.pavlovia.org/${name}`)}
            horizontal
        />
    </div>
{/snippet}

<div class=content>
    {#if current.user}
        {#await git.getProjectInfo({
            group: project.split("/")[0],
            name: project.split("/")[1]
        }, $state.snapshot(current.user))}
            {translate("Getting project info...")}
        {:then info}
            <div class=project-title>
                {#if info?.avatar_url}
                    <img 
                        style:height=8rem
                        src={info.avatar_url} 
                        alt="Project avatar"
                    />
                {/if}
                <div>
                    <h1>
                        {info.name}
                    </h1>
                    <span>
                        <a href={info.namespace.web_url}>
                            {info.namespace.name}
                        </a>
                        /
                        <a href={info.web_url}>
                            {info.path}
                        </a>
                    </span>
                </div>
            </div>

            {@html marked(info.description || "")}
        
            {#await projectsLoaded.promise}
                {translate("Checking whether {} is synced...").replace("{}", project)}
            {:then projects}
                <h3>{translate("Local files")}</h3>
                
                {#if project in projects}
                    {@render openCtrls(projects[project])}
                {:else if project.startsWith("demos/")}
                    {@render demoCtrls(project)}
                {:else}
                    {@render fetchCtrls(project, info)}
                {/if}
            {/await}
        {:catch err}
            {translate(
                "Failed to get project information. Server returned error: " + String(err)
            )}
        {/await}

        {#await git.listProjectForks(
            project,
            current.user
        ).then(
            forks => forks.filter(
                fork => fork.permissions.project_access?.access_level >= 30
            )
        ) then forks}
            {#if forks.length}
                <h3>Your forks</h3>
                {translate("There are forks (copies) of this project on Pavlovia which you have access to:")}
                {#each forks as fork}
                    <Button 
                        label={fork.path_with_namespace}
                        onclick={evt => project = fork.path_with_namespace}
                    />
                {/each}
            {/if}
        {/await}
    {:else}
        {translate(
            "You must be logged in to Pavlovia to view projects."
        )}
        <Button
            label={translate("Login")}
            onclick={async evt => {
                let users = await git.listUsers();
                if (users.length) {
                    current.user = users[0]
                } else {
                    current.user = await git.login()
                }
            }}
        />
    {/if}
</div>

<style>
    .content {
        display: flex;
        flex-direction: column;
        gap: .5rem;
    }
    .project-title {
        display: flex;
        flex-direction: row;
        gap: 1rem;
    }

    .button-array {
        display: flex;
        flex-direction: row;
        gap: .5rem;
        align-content: flex-start;
    }
</style>