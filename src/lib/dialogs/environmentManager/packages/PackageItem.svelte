<script>
    import { marked } from "marked";
    import VersionCtrl from "../VersionCtrl.svelte";
    import ProgressDlg from "../ProgressDlg.svelte";
    import { translate } from "$lib/translation";

    let {
        name,
        getProfile=name => {},
        installed=$bindable(),
        venv=$bindable()
    } = $props()

     // install progress information
    let showProgress = $state.raw(false)
</script>

<div class=package-page>
    {#await getProfile(name)}
        <h2>
            {translate("Getting package details...")}
        </h2>
    {:then profile}
        <div class=package-name><code>{profile.info.name}</code></div>
        <div class=ctrls>
            <VersionCtrl
                pipname={name}
                bind:installed={installed}
                venv={venv}
            />
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

<style>
    .package-desc {
        position: relative;
        border-radius: .5rem;
        box-sizing: border-box;
        width: 100%;
        overflow-x: auto;
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

    .ctrls {
        display: flex;
        flex-direction: row;
        align-items: stretch;
        gap: .5rem;
        margin: 1rem 0;
    }
</style>
