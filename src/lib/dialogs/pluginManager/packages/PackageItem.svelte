<script>
    import { marked } from "marked";
    import { getContext, untrack } from "svelte";
    import VersionCtrl from "../VersionCtrl.svelte";
    import ProgressDlg from "../ProgressDlg.svelte";
    import { translate } from "$lib/translation";

    let {
        name,
        getProfile=name => {},
        venv=$bindable()
    } = $props()

    let siblings = getContext("siblings");
    siblings.all.push(untrack(() => $state.snapshot(name)))

    $effect(() => {
        if (siblings.selected === undefined) {
            siblings.selected = page
        }
    })

     // install progress information
    let showProgress = $state.raw(false)
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
                <VersionCtrl 
                    pipname={name}
                    bind:installed={siblings.installed[name]}
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
{/snippet}

<button 
    class=package-item
    class:installed={siblings.installed[name]}
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
