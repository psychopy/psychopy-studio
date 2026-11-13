<script>
    import { Button } from "$lib/ui/button";
    import { translate } from "$lib/translation";
    import { MenuItem } from "$lib/ui/menu";
    import semver from "semver";
    import ProgressDlg from "./ProgressDlg.svelte";
    import { python } from "$lib/globals.svelte";

    let {
        pipname,
        installed=$bindable(),
        venv="app"
    } = $props()

    // install progress information
    let showProgress = $state.raw(false)

    async function getVersions() {
        return fetch(
            `https://pypi.org/pypi/${pipname}/json`
        ).then(
            resp => {
                // error if getting versions fails
                if (resp.ok) {
                    return resp.json()
                } else {
                    throw new Error(resp.status)
                }
            }
        ).then(
            // sort returned version numbers descending
            resp => Object.keys(
                resp.releases
            ).sort(
                (a, b) => {
                    try {
                        return semver.compare
                    } catch {
                        return 1
                    }
                }
            ).toReversed()
        )
    }

    async function install(version=undefined) {
        // show progress dlg
        showProgress = true
        // install specific version
        return python.venv.installPackage(
            venv, pipname, version
        ).then(
            resp => python.venv.getPackages(
                venv
            ).then(
                packages => installed = packages[pipname]
            )
        );
    }

    async function uninstall() {
        // show progress dlg
        showProgress = true
        // uninstall
        return await python.venv.uninstallPackage(
            venv, pipname
        ).then(
            resp => python.venv.getPackages(
                venv
            ).then(
                packages => installed = packages[pipname]
            )
        );
    }
</script>

{#await fetch(
    `https://pypi.org/pypi/${pipname}/json`
).then(
    resp => {
        // error if getting versions fails
        if (resp.ok) {
            return resp.json()
        } else {
            throw new Error(resp.status)
        }
    }
).then(
    // sort returned version numbers descending
    resp => Object.keys(
        resp.releases
    ).sort(
        (a, b) => {
            try {
                return semver.compare
            } catch {
                return 1
            }
        }
    ).toReversed()
) then versions}
    {#if installed}
        <Button
            label="{translate("Version")} {installed}"
            disabled={venv === undefined}
        >
            {#snippet menu(shown)}
                {#each versions as version}
                    <MenuItem
                        label={version}
                        icon={version === installed ? "/icons/sym-dot-blue.svg" : undefined}
                        onclick={evt => install(version)}
                    />
                {/each}
            {/snippet}
        </Button>

        {#if semver.parse(versions[0]) > installed}
            <Button
                label={translate("Update")}
                icon="/icons/btn-refresh.svg"
                onclick={evt => install(versions[0])}
                horizontal
            />
        {/if}
        <Button
            label={translate("Uninstall")}
            icon="/icons/btn-delete.svg"
            onclick={async evt => uninstall()}
            disabled={venv === undefined}
            horizontal
        />
    {:else}
        <Button
            label={translate("Install")}
            icon="/icons/btn-download.svg"
            onclick={evt => install()}
            disabled={venv === undefined}
        >
            {#snippet menu(shown)}
                {#each versions as version}
                    <MenuItem
                        label="Version {version}"
                        onclick={evt => install(version)}
                    />
                {/each}
            {/snippet}
        </Button>
    {/if}
{/await}

<ProgressDlg
    tag="uv:{pipname}"
    bind:shown={showProgress}
/>