<script>
    import { ListDetailItem } from "$lib/ui/listdetail";
    import VersionCtrl from "../VersionCtrl.svelte";

    let {
        plugin,
        installed=$bindable(),
        venv=$bindable()
    } = $props()
</script>


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
                <VersionCtrl
                    pipname={plugin.pipname}
                    bind:installed={installed}
                    venv={venv}
                />
            </div>
        </div>
    </header>
    {#each (plugin.description || "").split("\n") as line}
        <p>{line}</p>
    {/each}
</div>

<style>

    .plugin-page {
        display: flex;
        flex-direction: column;
        padding: 0 1rem;
        gap: 1rem;
        width: 45rem;
    }
    .plugin-page header {
        display: grid;
        position: relative;
        align-items: start;
        align-content: start;
        justify-items: start;
        justify-content: start;
        gap: 1rem;
        width: 100%;
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
</style>
