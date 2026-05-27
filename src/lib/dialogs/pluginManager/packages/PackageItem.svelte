<script>
    import { marked } from "marked";
    import { getContext } from "svelte";
    import { Button } from "$lib/utils/buttons";
    import ProgressDlg from "../ProgressDlg.svelte";
    import { translate } from "$lib/translation";

    let {
        name,
        getProfile=name => {},
        venv=$bindable()
    } = $props()

    let siblings = getContext("siblings");
    siblings.all.push($state.snapshot(name))

    $effect(() => {
        if (siblings.selected === undefined) {
            siblings.selected = page
        }
    })

     // install progress information
    let showProgress = $state.raw(false)

    let installed = $derived(
        Object.keys(siblings.installed).includes(name)
    )

    async function install(evt) {
        // show progress dlg
        showProgress = true
        // install
        return await python.venv.installPackage(
            venv, name
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
        // install
        return await python.venv.uninstallPackage(
            venv, name
        ).then(
            resp => python.venv.getPackages(
                venv
            ).then(
                packages => siblings.installed = packages
            )
        );
    }
</script>

{#snippet page()}
    <div class=package-page>
        {#await getProfile(name)}
            <h2>
                {translate("Getting package details...")}
            </h2>
        {:then profile}
            <div class=package-name><code>{profile.info.name}</code></div>
            <div class=ctrls>
                {#if !installed}
                    <Button
                        label={translate("Install")}
                        icon="/icons/btn-download.svg"
                        onclick={install}
                        horizontal
                    />
                {:else}
                    <Button
                        label={translate("Uninstall")}
                        icon="/icons/btn-delete.svg"
                        onclick={uninstall}
                        horizontal
                    />
                {/if}
            </div>
            <div class=package-desc>
                {@html marked(profile.info.description || "")}
            </div>
        {:catch err}
            <h2>
                {translate("Failed to load details for ")}
                <code>{name}</code>
            </h2>
            <div class=package-desc>
                {err}
            </div>
        {/await}

        <ProgressDlg
            tag="uv:{name}"
            bind:shown={showProgress}
        />
    </div>
{/snippet}

<button 
    class=package-item
    class:installed={installed}
    class:selected={siblings.selected === page}
    onclick={evt => siblings.selected = page}
>
    {name}
</button>

<style>
    .package-item {
        border: 1px solid var(--overlay);
        border-radius: .5rem;
        padding: .5rem;
        text-align: left;
        box-sizing: border-box;
        background-color: var(--mantle);
    }
    .package-item.selected {
        border: 1px solid var(--blue);
    }
    .package-item.installed {
        background-color: var(--base)
    }

    .package-desc {
        position: relative;
        border: 1px solid var(--overlay);
        padding: 1rem;
        border-radius: .5rem;
        overflow-x: hidden;
        word-wrap: break-word;
    }
    .package-page {
        display: flex;
        flex-direction: column;
        align-items: start;
        gap: .5rem;
        overflow-y: auto;
    }
    .package-name {
        font-size: 2rem;
    }
</style>
