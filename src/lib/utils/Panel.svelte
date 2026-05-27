<script>
    let {
        /** @prop @type {string} Text to display in this panel's sash */
        title,
        /** @interface */
        children=undefined
    } = $props()
</script>

<div class="panel">
    <div class="pnl-title">
        {title}
    </div>
    <div class="pnl-content">
        {@render children?.()}
    </div>
</div>


<style>
    :root {
        --panel-padding: .5rem;
    }
    .panel {
        display: grid;
        position: relative;
        background-color: var(--mantle);
        border-radius: .25rem;
        overflow: hidden;
        grid-template: min-content 1fr / 1fr;
        /* margin: .15rem;
        width: calc(100% - .3rem);
        height: calc(100% - .3rem); */
        width: 100%;
        height: 100%;
    }
    .panel .pnl-content {
        position: relative;
        height: stretch;
        width: stretch;
        overflow-y: auto;
        overflow-x: auto;
    }
    .panel .pnl-title {
        padding: .3em 1rem;
        background-color: var(--overlay);
        color: var(--text-on-overlay);
        width: stretch;
        overflow: hidden;
    }
</style>