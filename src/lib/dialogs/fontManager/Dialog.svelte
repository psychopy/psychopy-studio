<script>
    import { Dialog, DialogButton } from "$lib/ui/dialog";
    import { Notebook, NotebookPage } from "$lib/ui/notebook";
    import { Button, RadioButton } from "$lib/ui/button";
    import { FontManager } from "./manager.svelte.js";
    import { getContext } from "svelte";
    import { translate } from "$lib/translation";

    let {
        value=$bindable(),
        /** @bindable State controlling whether each button is disabled */
        buttonsDisabled={},
        /** @bindable @type {Boolean} State dictating whether this dialog is shown */
        shown=$bindable(),
    } = $props()

    let current = getContext("current")

    // restore value for this dialog's value (set on open/apply/ok)
    let restore = $state.snapshot(value);
    function apply(evt) {
        restore = $state.snapshot(value);
    }
    // search term
    let searchTerm = $state.raw("")
    // current tab
    let currentTab = $state.raw()
</script>


<Dialog
    data-testid=font-manager
    title={translate("Font Manager")}
    onopen={apply}
    bind:shown={shown}
>
    <div class=page>
        <input 
            type=search 
            class=search
            bind:value={searchTerm} 
        />
        <Notebook>
            {#each ["system", "packaged", "user", "experiment"] as source}
                <NotebookPage
                    label={FontManager[source].label}
                    bind:selected={
                        () => currentTab === source,
                        (value) => currentTab = source
                    }
                >
                    <div class=page>
                        <div class=info>
                            {FontManager[source].description}
                        </div>
                        {#each FontManager[source].fonts.filter(
                            name => name.toLowerCase().replaceAll(" ", "").includes(
                                searchTerm.toLowerCase().replaceAll(" ", "")
                            )
                        ) as name}
                            <RadioButton 
                                bind:selection={value}
                                value={name}
                                label={name}
                            />
                        {/each}
                        {#if FontManager[source].refresh}
                            <Button 
                                label={translate("Refresh")}
                                icon="/icons/btn-refresh.svg"
                                onclick={evt => FontManager[source].refresh(current.experiment)}
                                bind:awaiting={FontManager[source].scanning}
                                horizontal
                            />
                        {/if}
                    </div>
                </NotebookPage>
            {/each}
        </Notebook>
    </div>
    {#snippet buttons()}
        <DialogButton
            role=OK
            onclick={apply}
            disabled={buttonsDisabled.OK}
        />
        <DialogButton
            role=APPLY
            onclick={apply}
            disabled={buttonsDisabled.APPLY}
        />
        <DialogButton
            role=CANCEL
            onclick={evt => value = restore}
        />
    {/snippet}
</Dialog>

<style>
    .page {
        display: flex;
        flex-direction: column;
        gap: .5rem;
        padding: 1rem;
        min-width: 25rem;
    }
    .info {
        margin-bottom: 1rem;
    }
</style>