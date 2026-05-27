<script>
    import { python } from "$lib/globals.svelte";
    import { SubMenu, MenuItem } from "$lib/utils/menu/frameMenu";
    import { MessageDialog } from "$lib/utils/dialog";
    import { parsePath } from "$lib/utils/files";
    import { Script } from "$lib/experiment";
    import { getContext } from "svelte";
    import { translate } from "$lib/translation";

    let current = getContext("current")

    async function openDemo(file) {
        // parse path to an object
        file = parsePath(file)
        // create script from file
        let script = new Script(file);
        await script.fromFile(file)
        // remove file path so it just has a name (forcing "save as" rather than "save")
        script.file.file = script.file.name
        script.file.parent = ""
        // open script
        current.pages.push(
            script
        )
        // focus
        current.tab = current.pages.findIndex(item => item.file.file === script.file.file)
        // show save reminder
        reminder = true
    }

    let reminder = $state.raw(false)
</script>


{#snippet categ(label, demos)}
    <SubMenu label={label}>
        {#each Object.entries(demos) as [name, value]}
            {@render item(name, value)}
        {/each}
    </SubMenu>
{/snippet}

{#snippet demo(label, file)}
    <MenuItem 
        label={label}
        onclick={evt => openDemo(file)}
    />
{/snippet}

{#snippet item(label, item)}
    {#if typeof item === "object"}
        {@render categ(label, item)}
    {:else}
        {@render demo(label, item)}
    {/if}
{/snippet}

{#await python.liaison.send("app", {
    command: "run",
    args: ["psychopy.demos.coder:listDemos"]
}) then demos}
    {#each Object.entries(demos) as [label, value]}
        {@render item(label, value)}
    {/each}
{/await}


<MessageDialog
    title={translate("Reminder")}
    buttons={{
        OK: evt => {}
    }}
    bind:shown={reminder}
>
    {translate(
        "Click 'Save as...' to save this demo before running"
    )}
</MessageDialog>