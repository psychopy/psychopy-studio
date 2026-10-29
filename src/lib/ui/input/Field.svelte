<script>
    import { Tooltip } from "$lib/ui/tooltip"
    import { setContext } from "svelte";

    let {
        label,
        tooltip=undefined,
        children
    } = $props()

    let id = $props.id()
    let showTooltip = $state.raw(false)
    setContext("field", id)
</script>



<div class=label-wrapper>
    <span 
        class=label
        id={id}
        role=none
        onmouseenter={(evt) => showTooltip = true}
        onmouseleave={(evt) => showTooltip = false}
        onfocusin={(evt) => showTooltip = true}
        onfocusout={(evt) => showTooltip = false}
    >
        {label}

        {#if tooltip}
            <Tooltip 
                bind:shown={showTooltip}
                position=bottom
            >
                {tooltip}
            </Tooltip>
        {/if}
    </span>
    {@render children?.()}
</div>

<style>
    .label {
        justify-self: flex-start;
    }
    .label-wrapper {
        display: flex;
        flex-direction: column;
        gap: .5rem;
    }
</style>