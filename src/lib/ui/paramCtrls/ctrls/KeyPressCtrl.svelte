<script>
    import { validateKeypress } from "./validators.svelte.js";
    import { Button } from "$lib/ui/button";
    import { translate } from "$lib/translation";

    let {
        param=$bindable(),
        /** @prop @type {boolean} Controls whether this control is disabled */
        disabled=false,
        /** @interface */
        ...attachments
    } = $props()

    let selected = $state.raw(false);
    let hovered = $state.raw(false);
    let handle = $state.raw()

    // reset param and focus ctrl when selected
    $effect(() => {
        if (selected) {
            param.val.length = 0;
            handle.focus();
        }
    })
</script>

<div 
    class=container
    class:selected={selected}
    class:hovered={hovered}
    style:color={param.valid.value ? "inherit" : "var(--red)"}
    onmouseenter={evt => hovered = true}
    onmouseleave={evt => hovered = false}
    role=none
    {@attach element => param.registerValidator("keypress", validateKeypress, -5)}
    {...attachments}
>
    {#if selected}
        <input 
            type=text
            bind:this={handle}
            aria-label={param.label}
            onkeydown={evt => {
                // prevent usual effect
                evt.preventDefault()
                // if not in value, add it
                if (!param.val.includes(evt.key.toUpperCase())) {
                    param.val.push(evt.key.toUpperCase())
                }
            }}
            style:color={param.val.length ? "inherit" : "var(--outline)" }
            value={param.val.length ? param.val.join?.(" + ") : translate("Press keys, then click the tick to accept")}
        />
        <Button
            onclick={evt => param.val.length = 0}
            icon="/icons/btn-clear.svg"
            tooltip={translate("Clear keypresses")}
            small
        />
        <Button
            onclick={evt => selected = false}
            icon="/icons/btn-tick.svg"
            tooltip={translate("Done")}
            disabled={!param.valid.value}
            small
        />
    {:else}
        <input 
            type=text
            onclick={evt => selected = !disabled}
            style:color={hovered ? "var(--outline)" : "inherit"}
            value={hovered ? translate("Click to set") : param.val.join?.(" + ")}
        />
    {/if}
</div>


<style>
    .container {
        display: flex;
        position: relative;
        flex-grow: 1;
        gap: .5rem;
    }
    input {
        width: 100%;
    }
</style>