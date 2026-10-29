<script>
    import { RadioButton, Button } from "$lib/ui/button"
    import { Experiment } from "$lib/experiment";
    import { Icon } from "$lib/ui/icon";
    import { getContext } from "svelte";
    import callbacks from "../callbacks.svelte.js";
    import { translate } from "$lib/translation";
    
    let current = getContext("current");
</script>

<div class=panel>
    <div class=items>
        {#each Object.entries(current.runlist) as [i, item]}
            <div class=item>
                <Icon 
                    src="/icons/btn-{item.pilotMode ? "pilot" : "run"}py.svg"
                />
                <RadioButton 
                    bind:selection={current.selection}
                    value={parseInt(i)}
                    label="{item.file.name.length > 40 ? "..." : ""}{item.file.name.slice(-40)}"
                    tooltip={item.file.file}
                    icon="/icons/btn-{item instanceof Experiment ? "builder" : "coder"}.svg"
                    stretch
                    small
                />
                <Button
                    icon="/icons/btn-delete.svg"
                    tooltip={translate("Remove item")}
                    onclick={evt => delete current.runlist[parseInt(i)]}
                    small
                />
            </div>
        {/each}
    </div>
    <div class=ctrls>
        <Button 
            label={translate("Add file")}
            icon="/icons/btn-add.svg"
            onclick={evt => callbacks.open.fcn(false)}
            horizontal
        />
    </div>
</div>

<style>
.panel {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
    box-sizing: border-box;
    height: 100%;
}
.items {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: .5rem;
    flex-grow: 1;
    overflow-y: auto;
}
.item {
    display: grid;
    grid-template-columns: 1.5rem 1fr min-content;
    gap: .5rem;
    text-wrap: nowrap;
    text-overflow: ellipsis;
    box-sizing: border-box;
    width: 100%;
}
.ctrls {
    display: flex;
    flex-direction: row;
    gap: .5rem;
    justify-content: end;
}
</style>