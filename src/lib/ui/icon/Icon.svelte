<script>
    import { asset } from '$app/paths';

    let {
        src,
        size="100%",
        /** @prop @type {boolean} Are we awaiting execution of anything for this icon? */
        awaiting=$bindable()
    } = $props()

    // memoise source, so the URL is only recreated when the source actually changes (not just when the parent re-reads it)
    let source = $derived(String(src))
    // transform source to a URL
    let url = $derived.by(() => {
        if (source.match(/.*\.(svg|png|jpg|jpeg)/g)) {
            // if already looks like a url, return as is
            return asset(source)
        } else {
            // blobbify data to get around cross-origin security nonsense
            let blob = new Blob([source], {type: 'image/svg+xml'})

            return URL.createObjectURL(blob);
        }
    })
    // release blob URLs when replaced or unmounted
    $effect(() => {
        let current = url
        if (current.startsWith("blob:")) {
            return () => URL.revokeObjectURL(current)
        }
    })
</script>

{#if String(src).match(/.*\.(png|jpg|jpeg)/g)}
    <!-- rasterised images -->
    {#await awaiting}
        <img 
            class=icon
            style:width={size}
            style:height={size}
            src={asset("/icons/sym-pending.svg")} 
            alt="Loading..."
        />
    {:then}
        <img 
            class=icon
            style:width={size}
            style:height={size}
            src={url} 
            alt={url}
        />
    {:catch}
        <img 
            class=icon
            style:width={size}
            style:height={size}
            src={asset("/icons/sym-error.svg")} 
            alt="Error"
        />
    {/await}
{:else}
    <!-- responsive SVG vectors -->
    <svg 
        class=icon
        style:width={size}
        style:height={size}
    >
        {#await awaiting}
            <use href={asset("/icons/sym-pending.svg#animation")} />
        {:then}
            <use href={url} />
        {:catch}
            <use href={asset("/icons/sym-error.svg")} />
        {/await}
    </svg>
{/if}
