<script>
    import Flow from './Flow.svelte';
    import FlowControls from './controls/Panel.svelte';
</script>

<div class=flow-panel>
    <FlowControls />
    <Flow />
</div>

<style>
    .flow-panel {
        display: grid;
        grid-template-columns: [buttons] min-content [canvas] 1fr;
        height: 100%;
    }
</style>