<script>
    import ToggleButton from "./ToggleButton.svelte";

    let {
        selection=$bindable(),
        value,
        ...props
    } = $props();
</script>

<ToggleButton
    bind:value={
        () => selection === value,
        (state) => {
            if (state) {
                selection = value
            }
        }
    }
    {...props}
/>
