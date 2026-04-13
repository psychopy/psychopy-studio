<script>
    import { Button, DropdownButton } from "$lib/utils/buttons";
    import { MenuItem } from "$lib/utils/menu";
    import { Version } from "$lib/utils/versions.js";
    import { getContext } from "svelte";
    import { python } from "$lib/globals.svelte";
    import ProgressDlg from "../ProgressDlg.svelte";
    import { translate } from "$lib/translation";

    let {
        plugin,
        venv=$bindable()
    } = $props()

    let siblings = getContext("siblings");

    // install progress information
    let showProgress = $state.raw(false)


    $effect(() => {
        if (siblings.selected === undefined) {
            siblings.selected = page
        }
    })

    let installed = $derived(
        Object.keys(siblings.installed).includes(plugin.pipname)
    )

    let selectedVersion = $state.raw(
        siblings.installed[plugin.pipname]
    )

    async function install(version=undefined) {
        // show progress dlg
        showProgress = true
        // install specific version
        return python.venv.installPackage(
            venv, plugin.pipname, version
        ).then(
            resp => python.venv.getPackages(
                venv
            ).then(
                packages => siblings.installed = packages
            )
        );
    }

    async function uninstall(evt) {
        // show progress dlg
        showProgress = true
        // uninstall
        return await python.venv.uninstallPackage(
            venv, plugin.pipname
        ).then(
            resp => python.venv.getPackages(
                venv
            ).then(
                packages => siblings.installed = packages
            )
        );
    }

    async function getVersions(plugin) {
        let resp = await fetch(`https://pypi.org/pypi/${plugin.pipname}/json`).then(
            resp => {
                if (!resp.ok) {
                    throw new Error(resp.status)
                }

                return resp.json()
            }
        )

        return Object.keys(resp.releases).sort(Version.sorter)
    }

</script>

<!-- this is drawn or not drawn according to selection -->
{#snippet page()}
    <div class=plugin-page>
        <header>
            <img 
                class=avatar 
                src={plugin.icon} 
                alt={plugin.pipname} 
            />
            <div 
                class=details
            >
                <a href="{plugin.homepage}" class=name>
                    <h2>{plugin.name}</h2>
                </a>
                <code class=pipname>
                    {plugin.pipname}
                </code>
                <div class=header-ctrls>
                    {#if installed}
                        <DropdownButton
                            label="{translate("Version")} {siblings.installed[plugin.pipname]}"
                            disabled={venv === undefined}
                        >
                            {#await getVersions(plugin) then versions}
                                {#each versions as version}
                                    <MenuItem
                                        label={version}
                                        icon={version === siblings.installed[plugin.pipname] ? "/icons/sym-dot-blue.svg" : undefined}
                                        onclick={evt => install(version)}
                                    />
                                {/each}
                            {/await}
                        </DropdownButton>
                        {#await getVersions(plugin) then versions}
                            {#if Version.parse(versions[0]).newerThan(siblings.installed[plugin.pipname])}
                                <Button
                                    label={translate("Update")}
                                    icon="/icons/btn-refresh.svg"
                                    onclick={evt => install(versions[0])}
                                    horizontal
                                />
                            {/if}
                        {/await}
                        <Button
                            label={translate("Uninstall")}
                            icon="/icons/btn-delete.svg"
                            onclick={async evt => {
                                // show progress dlg
                                showProgress = true
                                // uninstall
                                return await python.venv.uninstallPackage(
                                    venv, plugin.pipname
                                ).then(
                                    resp => python.venv.getPackages(
                                        venv
                                    ).then(
                                        packages => siblings.installed = packages
                                    )
                                );
                            }}
                            disabled={venv === undefined}
                            horizontal
                        />
                    {:else}
                        <DropdownButton
                            label={translate("Install")}
                            icon="/icons/btn-download.svg"
                            onclick={evt => install()}
                            disabled={venv === undefined}
                        >
                            {#await getVersions(plugin) then versions}
                                {#each versions as version}
                                    <MenuItem
                                        label="Version {version}"
                                        onclick={evt => install(version)}
                                    />
                                {/each}
                            {/await}    
                        </DropdownButton>
                    {/if}
                </div>
            </div>
        </header>
        {#each (plugin.description || "").split("\n") as line}
            <p>{line}</p>
        {/each}
        

        <ProgressDlg
            tag="uv:{plugin.pipname}"
            bind:shown={showProgress}
        />
    </div>
{/snippet}



<button 
    class=plugin-item
    class:selected={siblings.selected === page}
    class:installed={installed}
    onclick={evt => siblings.selected = page}
>
    <img 
        class=avatar 
        src={plugin.icon} 
        alt={plugin.pipname} 
    />
    <div class=details>
        <h3 class=name>
            {plugin.name}
        </h3>
        <code class=pipname>
            {plugin.pipname}
        </code>
    </div>
    
</button>

<style>

    .plugin-page {
        display: flex;
        flex-direction: column;
        padding: 0 1rem;
        gap: 1rem;
        width: 45rem;
    }
    .plugin-item, .plugin-page header {
        display: grid;
        position: relative;
        align-items: start;
        align-content: start;
        justify-items: start;
        justify-content: start;
        gap: 1rem;
        width: 100%;
    }

    .plugin-item {
        grid-template-columns: [avatar] 4rem [start] 1fr [end];
        border: 1px solid var(--overlay);
        border-radius: .5rem;
        padding: 1rem;
        box-sizing: border-box;
        background-color: var(--mantle);
    }
    .plugin-item.selected {
        border: 1px solid var(--blue);
    }
    .plugin-item.installed {
        background-color: var(--base)
    }

    .plugin-page header {
        grid-template-columns: [avatar] 6rem [start] 1fr [end];
    }
    
    .name {
        text-decoration: none;
        color: var(--text);
        font-size: 1.25rem;
        grid-column: start / button;
        text-align: left;
    }

    .avatar {
        border-radius: .5rem;
        width: 100%;
    }
    .details {
        text-align: left;
    }
    .header-ctrls {
        display: flex;
        flex-direction: row;
        align-items: stretch;
        gap: .5rem;
        margin: 1rem 0;
    }
    .version-ctrl {
        display: flex;
        flex-direction: row;
        gap: .5rem;
        width: 100%;
    }
    #version-ctrl {
        flex-grow: 1;
    }

/*     

    .plugin-install-btn {
        margin-top: .5rem;
        grid-row-start: button;
        grid-column-start: start;
    }
    .plugin-item {
        border: 1px solid var(--overlay);
        border-radius: .5rem;
        padding: 1rem;
        box-sizing: border-box;
        background-color: var(--mantle);
    }
    .plugin-item.selected {
        border: 1px solid var(--blue);
    }
    .plugin-item.installed {
        background-color: var(--base)
    }

    .plugin-name {
        font-weight: bold;
        text-decoration: none;
        color: var(--text);
        font-size: 1.25rem;
        grid-column: start / button;
        text-align: left;
    }
    .plugin-item .plugin-name {
        font-size: 1.25rem;
    }
    .plugin-page .plugin-name {
        font-size: 2rem;
    }

    .plugin-pipname {
        grid-column: start / button;
    }

    .plugin-avatar {
        border-radius: .5rem;
        grid-row: start / end;
    }
    .plugin-item .plugin-avatar {
        width: 4rem;
    }
    .plugin-page .plugin-avatar {
        width: 8rem;
    }

    .plugin-page {
        display: flex;
        flex-direction: column;
        align-items: start;
        gap: .5rem;
        width: 45rem;
    } */
</style>