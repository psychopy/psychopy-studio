<script>
    import { Button } from "$lib/utils/buttons";
    import { Dialog } from "$lib/utils/dialog";
    import Project from "./Project.svelte";
    import { projects } from "$lib/globals.svelte";
    import { translate } from "$lib/translation";

    let {
        shown=$bindable()
    } = $props()

    async function openProjectsFile(evt) {
        // get file handle from system dialog
        let handle = await window.showOpenFilePicker({
            types: [{
                description: "PsychoPy Projects",
                accept: {
                    "application/json": [".json"]
                }
            }]
        });
        // get file blob from handle
        let file = await handle[0].getFile();
        // get data from JSON text
        let data = JSON.parse(
            await file.text()
        )
        // set data
        projectsFromJSON(data)

        console.log(`Loaded devices from ${file.name}:`, data);
    }

    function projectsFromJSON(data) {
        // reset
        Object.keys(projects).forEach((key) => delete projects[key])
        // add each device from the JSON as an object
        for (let [key, proj] of Object.entries(data)) {
            // populate
            projects[key] = proj;
        }
    }

</script>


<Dialog
    id=manageProjects
    title={translate("Local projects")}
    bind:shown={shown}
    buttons={{
        OK: (evt) => {}
    }}
>
    <div
        class=projects-list
    >
        {#each Object.values(projects) as profile}
            <Project 
                project={profile} 
            />
        {/each}

        <Button
            label="Import projects"
            onclick={openProjectsFile}
        />
    </div>
</Dialog>

<style>
    .projects-list {
        display: flex;
        flex-direction: column;
        width: 35rem;
        padding: 1rem;
        gap: .5rem;
    }
</style>