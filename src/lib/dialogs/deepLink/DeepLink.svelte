<script>
    import { electron, git } from "$lib/globals.svelte";
    import { Dialog, MessageDialog } from "$lib/utils/dialog";
    import { Button } from "$lib/utils/buttons";
    import { parsePath, browseFileOpen } from "$lib/utils/files";
    import { openIn } from "$lib/utils/views.svelte";
    import { getContext } from "svelte";
    import { marked } from "marked";
    import { translate } from "$lib/translation";
    import path from "path-browserify";

    let {
        project,
        shown=$bindable()
    } = $props();

    let projectsLoaded = $state.raw(
        git.loadProjects()
    )

    let show = $state({
        forkPrompt: false
    })

    let busy = $state({
        cloning: Promise.resolve(false)
    })

    let current = getContext("current");

    async function fileOpen(folder) {
        // browse files
        let file = await browseFileOpen([
            { description: translate("PsychoPy Experiments"), accept: {"application/xml": [".psyexp"]} },
            { description: translate("Python Scripts"), accept: {"text/x-python-code": [".py"]} },
            { description: translate("JavaScript Scripts"), accept: {"text/javascript": [".js"]} }
        ], folder)
        // abort if cancelled
        if (!file) {
            return
        }
        // open in appropriate view
        if (file.ext === ".psyexp") {
            openIn(file.file, "builder")
        } else {
            openIn(file.file, "coder")
        }
        // close
        shown = false
    }

    /**
     * Clone a a given remote project to this machine
     */
    async function clone(targetProject=project) {
        // prompt user to choose folder
        let folder = await electron.files.openDialog({
            title: translate("Choose folder for Pavlovia project"),
            buttonLabel: translate("Clone"),
            properties: ["openDirectory"],
        })
        // abort if cancelled
        if (!folder) {
            return
        }
        // clone
        await git.clone(
            {
                group: targetProject.split("/")[0],
                name: targetProject.split("/")[1],
                folder: path.join(folder[0], targetProject.split("/")[1])
            }, 
            $state.snapshot(current.user)
        )
        // reload projects
        projectsLoaded = git.loadProjects()
    }

    /**
     * Fork and clone the remote project to this machine
     */
    async function fork() {
        // create fork
        let newProject = await git.fork(
            {
                groupFrom: project.split("/")[0],
                groupTo: $state.snapshot(current.user),
                name: project.split("/")[1]
            },
            $state.snapshot(current.user)
        )
        // clone new project
        return await clone(newProject)
    }
</script>

<Dialog
    title="Opening {project}..."
    bind:shown={shown}
    shrink
>
    <div class=container>
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

                {#await projectsLoaded}
                    {translate("Checking whether project is synced...")}
                {:then projects}
                    {#if project in projects}
                        <Button 
                            label={translate("Open file")}
                            icon="/icons/btn-open.svg"
                            onclick={evt => fileOpen(projects[project])}
                            horizontal
                        />
                        {#await electron.files.scandir(projects[project], true) then files}
                            {#each files.map(file => parsePath(file)) as file}
                                {#if file.ext === ".psyexp"}
                                    <Button 
                                        label={translate("Run {}").replace("{}", file.stem)}
                                        icon="/icons/btn-runpy.svg"
                                        onclick={evt => {
                                            openIn(path.join(projects[project], file.file), "runner");
                                            shown = false;
                                        }}
                                        horizontal
                                    />
                                {/if}
                            {/each}
                        {/await}
                    {:else}
                        <h3>Not synced</h3>
                        {translate(
                            "This project is not synced to your local machine. Would you like to fetch it from Pavlovia?"
                        )}
                        <div class=button-array>
                            <Button
                                label="Fetch"
                                icon="/icons/btn-download.svg"
                                onclick={async evt => {
                                    if (current.user === info.namespace.name) {
                                        // if this is their own project, clone it
                                        return await clone()
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
                                buttons={{
                                    YES: evt => fork(),
                                    NO: evt => clone(project)
                                }}
                                bind:shown={show.forkPrompt}
                            >
                                {translate(
                                    "This project belongs to {}, would you like to create a fork (copy) of it on your Pavlovia account?"
                                ).replaceAll("{}", info.namespace.name)}
                            </MessageDialog>
                        </div>
                    {/if}
                {/await}
            {:catch err}
                {translate(
                    "Failed to get project information. Server returned error: " + String(err)
                )}
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

    .project-title {
        display: flex;
        flex-direction: row;
        gap: .5rem;
    }
</style>