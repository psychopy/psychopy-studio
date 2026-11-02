<script>
    import { DropdownButton } from "$lib/ui/button";
    import { getContext } from "svelte";
    import { MenuItem, MenuSeparator } from "$lib/ui/menu";
    import { git } from "$lib/globals.svelte";
    import ManageProjectsDlg from "$lib/dialogs/projects/manage/ManageProjectsDlg.svelte";
    import NewProjectDlg from "./NewProjectDlg.svelte";
    import { translate } from "$lib/translation";
    import { BrowseDemosDlg } from "$lib/pavlovia/demos";
    import { SearchProjectsDlg } from "$lib/pavlovia/search";

    let current = getContext("current")

    let show = $state({
        newProjectDlg: false,
        manageProjectsDlg: false,
        browseDemosDlg: false,
        searchProjectsDlg: false,
    })
    let awaiting = $state({
        newProjectDlg: Promise.withResolvers(),
        browseDemosDlg: Promise.withResolvers(),
        searchProjectsDlg: Promise.withResolvers(),
    })

    // refresh project when experiment or user changes
    $effect(
        () => git.getProjectInfo(
            { folder: current.experiment.file.parent }, 
            $state.snapshot(current.user)
        ).then(
            resp => current.project = resp
        )
    )

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
            return translate("No project")
        }
    })
</script>

<DropdownButton
    label={label}
    onclick={(evt) => {
        if (current.project) {
            window.open(current.project.web_url.replace("gitlab.pavlovia", "pavlovia"))
        }
    }}
    disabled={!current.project}
>
    {#if !current.project}
        <MenuItem
            label={translate("New project")}
            icon="/icons/btn-add.svg"
            onclick={evt => show.newProjectDlg = true}
            disabled={!current.user || !current.experiment?.file?.file}
        />
    {/if}
    <MenuItem
        label={translate("Edit project")}
        icon="/icons/btn-edit.svg"
        onclick={evt => window.open(`${current.project.web_url}/edit`, "_blank")}
        disabled={!current.project}
    />
    <MenuSeparator/>
    <MenuItem 
        label={translate("Browse demos")}
        icon="/icons/btn-demos.svg" 
        onclick={evt => show.browseDemosDlg = true}
        borderless
    />
    <MenuItem
        label={translate("Search projects")}
        icon="/icons/btn-find.svg"
        onclick={(evt) => show.searchProjectsDlg = true}
    />
</DropdownButton>

<ManageProjectsDlg 
    bind:shown={show.manageProjectsDlg}
/>
<NewProjectDlg 
    bind:shown={show.newProjectDlg}
    bind:awaiting={awaiting.newProjectDlg}
/>
<BrowseDemosDlg
    bind:shown={show.browseDemosDlg}
    bind:awaiting={awaiting.browseDemosDlg}
/>
<SearchProjectsDlg
    bind:shown={show.searchProjectsDlg}
    bind:awaiting={awaiting.searchProjectsDlg}
/>