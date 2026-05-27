<script>
    import { electron } from "$lib/globals.svelte";
    import { CompactButton } from "$lib/utils/buttons";
    import path from "path-browserify";
    import { getContext } from "svelte";
    import { translate } from "$lib/translation";

    let {
        value=$bindable(),
        onchange=value => {}
    } = $props()

    let current = getContext("current")

</script>

<div class=dir-ctrl>
    <input 
        class=directory
        style:flex-grow=1
        bind:value={value} 
        aria-label={translate("Current file path")}
        disabled 
    />
    <CompactButton 
        icon="/icons/btn-open.svg"
        tooltip={translate("Open folder...")}
        onclick={async evt => {
            // get folder path from electron dialog
            let folder = await electron.files.openDialog({
                properties: ["openDirectory"]
            })
            // abort if no file
            if (folder === undefined) {
                return
            }
            // set value
            value = folder[0]
            onchange($state.snapshot(value))
        }}
    />
    <CompactButton 
        icon="/icons/btn-dirup.svg"
        tooltip={translate("Up to parent directory")}
        onclick={evt => {
            // set
            value = path.dirname(value)
            onchange($state.snapshot(value))
        }}
    />
    <CompactButton 
        icon="/icons/btn-target.svg"
        tooltip={translate("Navigate to current file")}
        onclick={evt => {
            // set
            value = current.pages[current.tab].file.parent
            onchange($state.snapshot(value))
        }}
        disabled={current.pages[current.tab] === undefined}
    />
</div>

<style>
    .dir-ctrl {
        display: flex;
        flex-direction: row;
        gap: .5rem;
        width: 100%;
        padding: .5rem;
        box-sizing: border-box;
    }
    .directory {
        min-width: 0;
    }
</style>