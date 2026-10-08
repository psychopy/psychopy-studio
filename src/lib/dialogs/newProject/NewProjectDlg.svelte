<script>
    import { Dialog } from "$lib/utils/dialog";
    import { CompactButton } from "$lib/utils/buttons";
    import { TreeRoot, TreeBranch, TreeNode } from "$lib/utils/tree";
    import { fileIcons, parsePath } from "$lib/utils/files";
    import { translate } from "$lib/translation";

    let {
        shown=$bindable()
    } = $props();

    function datef(offset) {
        // current time
        let d = new Date(Date.now())
        // apply offset
        d.setMinutes(d.getMinutes() - offset)
        // format
        return `${d.getFullYear()}${d.getMonth()}${d.getDate()}T${d.getHours()}${d.getMinutes()}${d.getSeconds()}`
    }

    let name = $state.raw();
    let experimentNames = $state([""]);
    let examples = $state.raw(false);
    let structure = $derived([
        {
            name: name,
            children: [
                {
                    name: "analysis",
                    description: "Files relevant to your analysis",
                    children: []
                },
                {
                    name: "data",
                    description: "Data from your experiment(s)",
                    children: [
                        {
                            name: "raw",
                            description: "Raw data straight from running the experiment(s)",
                            children: examples ? experimentNames.map(
                                (key, i) => [
                                    `exp-${key}_p-123456_time-${datef(1 + i)}.csv`,
                                    `exp-${key}_p-123456_time-${datef(1 + i)}.log`,
                                    `exp-${key}_p-pilot_time-${datef(2 + i)}.csv`,
                                    `exp-${key}_p-pilot_time-${datef(2 + i)}.log`
                                ]
                            ).flat() : []
                        },
                        "data_description.json"
                    ]
                },
                {
                    name: "documentation",
                    description: "Documentation for collaborators to understand your project",
                    children: [
                        "README.md"
                    ]
                },
                {
                    name: "ethics",
                    description: "Files from your ethics application",
                    children: examples ? [
                        "application.docx",
                        "result.pdf"
                    ] : []
                },

                {
                    name: "experiments",
                    description: "Your experiments themselves",
                    children: experimentNames.map(
                        key => {return {
                            name: key,
                            children: [
                                {
                                    name: "conditions",
                                    description: "Conditions files for your experiment's loops",
                                    children: examples ? [
                                        "trialConds.xlsx"
                                    ] : []
                                },
                                `${key}.psyexp`, 
                                "README.md"
                            ] + examples ? [`${key}.py`, `${key}.js`, "index.html"] : []
                        }}
                    )
                },
                {
                    name: "materials",
                    children: [
                        {
                            name: "stimuli",
                            description: "Stimuli for your experiment(s)",
                            children: examples ? [
                                "condA.png",
                                "condB.png"
                            ] : []
                        }
                    ]
                },
                {
                    name: "preregistration",
                    description: "Files from recruitment, consent forms, debriefs, etc.",
                    children: examples ? experimentNames.map(
                        key => [`${key}_consent.docx`, `${key}_debrief.docx`]
                    ).flat() : []
                },
                {
                    name: "reports",
                    description: "Writeups of your project",
                    children: examples ? [
                        "conference.ppt",
                        "writeup.repmd"
                    ] : []
                },
                "README.md",
                "project_description.json"
            ]
        }
    ])
</script>

{#snippet folder(struct)}
    <TreeBranch
        label={struct.name}
        tooltip={struct.description}
    >
        {#each struct.children as child}
            {#if child instanceof Object}
                {@render folder(child)}
            {:else}
                <TreeNode 
                    label={child}
                    icon="/icons/filetypes/{fileIcons[parsePath(child || "").ext] || "unknown"}.svg"
                />
            {/if}
        {/each}
    </TreeBranch>
{/snippet}

<Dialog
    title={translate("New project")}
    bind:shown={shown}
>
    <div class=content>
        <input 
            placeholder={translate("Name project")}
            bind:value={name}
        />

        Experiments...
        {#each Object.keys(experimentNames) as i}
            <input
                placeholder={translate("Name experiment")}
                bind:value={experimentNames[i]}
            />
        {/each}
        <CompactButton 
            label={translate("Add experiment")}
            icon=/icons/btn-add.svg
            onclick={evt => experimentNames.push("")}
        />
        
        Here's a preview of how your project will look:

        <TreeRoot>
            {@render folder(structure[0])}
        </TreeRoot>

        Add some example data, stimuli, etc.?
        <input type=checkbox bind:checked={examples} />
    </div>
</Dialog>

<style>
    .content {
        display: flex;
        flex-direction: column;
        gap: .5rem;
        padding: 1rem;
        min-width: 40rem;
    }
</style>
