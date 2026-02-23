<script>
    import { DropdownButton } from "$lib/utils/buttons";
    import { getContext, onMount } from "svelte";
    import { projects, users, findProject } from "./pavlovia.svelte";
    import { MenuItem, MenuSeparator, SubMenu } from "$lib/utils/menu";
    import { electron, git } from "$lib/globals.svelte";
    import ManageProjectsDlg from "$lib/dialogs/projects/manage/ManageProjectsDlg.svelte";
    import NewProjectDlg from "./NewProjectDlg.svelte";
    import DemosDialog from "$lib/dialogs/demos/DemosDialog.svelte";

    let current = getContext("current")

    onMount(async () => {
        // no saved projects if not in electron
        if (!electron) {
            return
        }
        // get file path
        let file = await electron.paths.pavlovia.projects();
        let dir = await electron.paths.pavlovia.dir();
        // make sure pavlovia folder exists
        if (!(await electron.files.exists(dir))) {
            await electron.files.mkdir(dir);
        }
        // make sure projects.json exists
        if (!(await electron.files.exists(file))) {
            await electron.files.save(file, "{}");
        }
        // get file contents
        let content = await electron.files.load(file);
        // parse JSON
        let data = JSON.parse(content);
        // apply
        Object.assign(projects, data)
    })

    let show = $state({
        manageProjectsDlg: false,
        browseProjectsDlg: false,
        demosDlg: false
    })

    // refresh project when experiment or user changes
    $effect(async () => current.project = await findProject(current.experiment, current.user))
    $inspect(current.project)

    let label = $derived.by(() => {
        if (current.project) {
            if (current.project.owner?.username === current.user?.profile?.username) {
                // if owner is current user, just display name
                return current.project.path 
            } else {
                // otherwise, display group and name
                return `${current.project.namespace?.path}/${current.project.path}`
            }
        } else {
            // if no project, no label
            return "No project"
        }
    })
</script>

<DropdownButton
    label={label}
    onclick={(evt) => {
        if (current.project) {
            window.open(current.project.web_url)
        }
    }}
    disabled={!current.project}
>
    <MenuItem
        label="New project"
        icon="/icons/btn-add.svg"
        onclick={evt => show.newProjectDlg = true}
        disabled={!current.user}
    />
    <MenuItem
        label="Edit project"
        icon="/icons/btn-edit.svg"
        onclick={evt => window.open(`${current.project.web_url}/edit`, "_blank")}
        disabled={!current.project}
    />
    <MenuItem
        label="Manage local projects..."
        icon="/icons/btn-edit.svg"
        onclick={evt => show.manageProjectsDlg = true}
    />
    <MenuSeparator/>
    <MenuItem
        label="Search projects..."
        icon="/icons/btn-find.svg"
        onclick={evt => show.browseProjectsDlg = true}
    />
    <MenuItem
        label="Browse demos..."
        onclick={evt => show.demosDlg = true}
    />
</DropdownButton>

<ManageProjectsDlg 
    bind:shown={show.manageProjectsDlg}
/>
<NewProjectDlg 
    bind:shown={show.newProjectDlg}
/>
<DemosDialog
    bind:shown={show.demosDlg}
/>