<script>
    import PanelButton from '$lib/ui/button/PanelButton.svelte';

    let {
        label,
        children
    } = $props()

</script>

<PanelButton
    label={label}
    data-testclass=component-category
>
    <div class=component-section-buttons>
        {@render children?.()}
    </div>
</PanelButton>

<style>
    .component-section-buttons {
        display: flex;
        flex-wrap: wrap;
        padding: 1rem;
        gap: .5rem;
    }
</style>