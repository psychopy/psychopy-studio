<script>
    import { Icon } from "$lib/ui/icon";
    import AttachedButton from "$lib/ui/button/AttachedButton.svelte";
    import { translate } from "$lib/translation";
    import { fly } from "svelte/transition";
    let {
        message,
        icon=undefined,
        onclick=evt => {},
        /** @prop @type {function|undefined} Function to dismiss this message (setting this will show the dismiss button) */
        ondismiss=undefined
    } = $props()
</script>


<div
    class=message-ctrl
    transition:fly
>
    <AttachedButton
        icon="/icons/sym-close.svg"
        onclick={ondismiss}
        tooltip={translate("Dismiss")}
        position="right"
    >
        <button
            class=message
            onclick={onclick}
        >
            {#if icon}
                <Icon
                    src={icon}
                    size=1.5em
                />
            {/if}
            {message}
        </button>
    </AttachedButton>
</div>

<style>
    .message {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: .5rem;
        background-color: var(--outline);
        color: var(--base);
        border-radius: .5rem;
        padding: .5rem 1rem;
        padding-right: 2.5rem;
    }
</style>
