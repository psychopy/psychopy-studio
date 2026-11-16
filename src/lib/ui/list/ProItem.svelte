<script>
    let {
        /** @prop {Snippet} children Child elements are rendered as with a normal li */
        children,
        /** @prop {ComponentProps} props Other props are passed to the li element*/
        ...props
    } = $props()
</script>

<li
    class=pro
    {...props}
>
    {@render children?.()}
</li>

<style>
    li.pro {
        list-style-type: "✓";
        padding-left: .5em;
        margin-left: .5em;
    }

    li.pro::marker {
        font-weight: bold;
        font-family: var(--emoji);
        
        color: var(--green);
    }
</style>