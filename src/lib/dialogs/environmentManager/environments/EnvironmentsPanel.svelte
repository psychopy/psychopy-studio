<script>
    import { RadioButton, Button } from "$lib/ui/button";
    import { Icon } from "$lib/ui/icon";
    import { MenuItem } from "$lib/ui/menu";
    import { Info } from "$lib/ui/tooltip";
    import { MessageDialog, DialogButton } from "$lib/ui/dialog";
    import { python } from "$lib/globals.svelte";
    import { setupPython } from "$lib/python/functions.svelte.js";
    import semver from "semver";
    import { translate } from "$lib/translation";

    let {
        value=$bindable()
    } = $props()

    // keep track of when we're confirming deletion
    let deleting = $state({
        showDlg: false,
        version: undefined
    })
    // keep track of whether we're creating a new environment
    let creating = $state({
        showDlg: false,
        version: undefined
    })
    // promise which resolves to the currently installed environments
    let environmentsPromise = $state.raw(
        python.uv.getEnvironments()
    )
</script>


<div class=container>
    <div class=title>
        <h3>{translate("Environments")}</h3>
        <Info>
            {translate("PsychoPy Studio creates a separate Python environment for each version of PsychoPy you run an experiment in (e.g. via the 'Use version' param). Each has their own plugins and packages installed.")}
        </Info>
    </div>
    {#await environmentsPromise then environments}
        <div class=venv-panel>
            {#each environments.toReversed() as env}
                <RadioButton
                    bind:selection={value}
                    value={env.isApp ? "app" : env.name}
                    large
                    opaque
                >
                    {#snippet label()}
                        <div class=details>
                            <h5>
                                {env.name}
                                {#if env.isApp}
                                    {translate("(app)")}
                                {/if}
                            </h5>
                            <div class=python-badge>
                                <Icon
                                    src="/icons/sym-python.svg"
                                    size=1.4em
                                />
                                {env.pythonVersion}
                            </div>
                        </div>
                    {/snippet}
                    {#snippet contextmenu()}
                        <MenuItem 
                            label={env.isApp ? translate("Cannot delete app environment") : translate("Delete")}
                            icon="/icons/btn-delete.svg"
                            onclick={async evt => {
                                deleting.showDlg = true
                                deleting.version = env.name
                            }}
                            disabled={env.isApp}
                        />
                    {/snippet}
                </RadioButton>
            {/each}
        </div>
        <Button 
            label={translate("New environment")}
            tooltip={translate("Create a new environment for a PsychoPy version you don't yet have one for")}
            icon="/icons/btn-add.svg"
            onclick={evt => creating.showDlg = true}
            opaque
            small
        />
    {:catch err}
        {translate("Failed to get environments")}
        <pre>{err}</pre>
    {/await}
</div>


<!-- confirmation dialog for deleting a venv -->
<MessageDialog
    title={translate("Confirm deletion")}
    bind:shown={deleting.showDlg}
>
    {translate(
        "Are you sure you want to delete the environment for {}? This cannot be undone."
    ).replace("{}", deleting.version)}
    {#snippet buttons()}
        <DialogButton 
            action="YES" 
            onclick={async evt => {
                // deselect venv
                if (value === deleting.version) {
                    value = "app"
                }
                // delete venv
                await python.venv.delete(deleting.version)
                // rescan
                environmentsPromise = python.uv.getEnvironments()
                // clear deleting version
                deleting.version = undefined
            }}
            negative
        />
        <DialogButton 
            action="NO" 
            negative={false}
        />
    {/snippet}
</MessageDialog>

<!-- dialog for creating a new environment -->
<MessageDialog
    title={translate("Create new environment")}
    bind:shown={creating.showDlg}
>
    <div
        class=install-dlg-container
    >
        {translate(
            "Choose a version of PsychoPy to create a new environment for:"
        )}
        <select
            bind:value={creating.version}
        >
            {#await environmentsPromise then environments}
                {#await fetch(
                    "https://pypi.org/pypi/psychopy/json", 
                    {method: "GET"}
                ).then(resp => resp.json()) then resp}
                    {#each Object.keys(resp.releases).toReversed() as version}
                        {#if 
                            semver.valid(version) 
                            && semver.gte(version, "2022.1.0") 
                            && !environments.some(env => env.name === version)
                        }
                            <option value={version}>
                                {version}
                            </option>
                        {/if}
                    {/each}
                {/await}
            {/await}
        </select>
    </div>
    {#snippet buttons()}
        <DialogButton 
            action="OK"
            onclick={async evt => {
                // create environment
                await setupPython(creating.version)
                // rescan
                environmentsPromise = python.uv.getEnvironments()
                // clear version selection
                creating.version = undefined
            }}
            disabled={!creating.version}
        />
        <DialogButton 
            action="CANCEL"
        />
    {/snippet}
</MessageDialog>


<style>
    .title {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: .5rem;
    }
    .container,
    .venv-panel {
        display: flex;
        flex-direction: column;
        justify-content: start;
        gap: .5rem;
        flex-grow: 1;
    }
    .container {
        padding: .5rem;
        min-width: 14rem;
    }
    .venv-panel {
        overflow-y: auto;
        overflow-y: auto;
        flex-grow: 1;
        padding-right: .5rem;
    }

    .details {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        width: 100%;
    }
    .python-badge {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: .2rem;
    }
    .install-dlg-container {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        gap: .5rem;
    }
</style>
