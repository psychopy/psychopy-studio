<script>
    import Dialog from "./Dialog.svelte";

    let {
        id,
        /** @prop @type {String} Text to display in the title bar of this dialog */
        title="",
        /** @prop @type {Snippet|Array<"OK"|"APPLY"|"CANCEL"|"YES"|"NO">|undefined} DialogButton components to display (positioned according to their role), or a list of roles to create default buttons for */
        buttons=undefined,
        /** @returns @type {HTMLElement} Handle of this dialog's HTML Element */
        shown=$bindable(),
        /** @prop {Snippet} children Child elements are rendered */
        children=undefined,
        /** @prop {ComponentProps} props Additional props are passed to the `Dialog` element */
        ...props
    } = $props();
</script>

<Dialog
    id={id}
    title={title}
    buttons={buttons}
    bind:shown={shown}
    shrink={true}
    {...props}
>
    <div class="dlg-message">
        {@render children?.()}
    </div>
</Dialog>

<style>
    .dlg-message {
        padding: 1rem;
        min-width: 45rem;
    }
</style>