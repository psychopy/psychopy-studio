<script>
    let {
        /** @prop {Snippet} children Child elements are rendered as with a normal li */
        children,
        /** @prop {ComponentProps} props Other props are passed to the li element*/
        ...props
    } = $props()
</script>

<li
    class=con
    {...props}
>
    {@render children?.()}
</li>

<style>
    li.con {
        list-style-type: "✗";
        padding-left: .5em;
        margin-left: .5em;
    }

    li.con::marker {
        font-weight: bold;
        font-family: var(--emoji);
        color: var(--red);
    }
</style>