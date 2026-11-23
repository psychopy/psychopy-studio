<script>
    let {
        content,
        ...props
    } = $props()
</script>

<div 
    class=placeholder-page
    {...props}
>
    <svg class=placeholder-bg>
        <use href={"/branding/emblem-line.svg"} />
    </svg>
    {#if typeof content === "function"}
        {@render content?.()}
    {:else}
        {content}
    {/if}
</div>

<style>
    .placeholder-page {
        position: absolute;
        left: 0; right: 0; top: 0; bottom: 0;
        background-color: var(--crust);
        color: var(--outline);
        overflow: hidden;
        display: flex;
        gap: .5rem;
        flex-direction: column;
        align-items: center;
        align-content: center;
        justify-items: center;
        justify-content: center;
    }

    .placeholder-page svg.placeholder-bg {
        color: var(--outline);
        opacity: 10%;
        width: 100%;
        height: auto;
        aspect-ratio: 2560 / 321;
    }
</style>