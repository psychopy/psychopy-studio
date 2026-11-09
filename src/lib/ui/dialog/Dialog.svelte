<script>
    import DialogButton from "./DialogButton.svelte";
    import { Icon } from "$lib/ui/icon";
    import { onMount, setContext, untrack } from "svelte";
    import { electron } from "$lib/globals.svelte";
    import { translate } from "$lib/translation";

    let {
        id,
        /** @prop @type {string} Text to display in the title bar of this dialog */
        title="",
        /** @prop @type {import("svelte").Snippet|Array<"OK"|"APPLY"|"CANCEL"|"YES"|"NO">|undefined} DialogButton components to display (positioned according to their role), or a list of roles to create default buttons for */
        buttons=undefined,
        /** @bindable @type {Boolean} State dictating whether this dialog is shown */
        shown=$bindable(),
        /** @prop @type {Function} Function to execute when this dialog is opened */
        onopen=() => {},
        /** @prop @type {Function} Function to execute when this dialog is closed */
        onclose=() => {},
        /** @prop @type {Boolean} Determines whether the dialog box should shrink to fit its contents */
        shrink=false,
        /** @prop @type {boolean} Whether or not to include a close button */
        closable=true,
        /** @interface */
        children=undefined
    } = $props();

    let handle;

    // pass context to children (namely buttons)
    let registeredButtons = $state({
        OTHER: []
    })
    let context = {
        get shown() { return shown },
        set shown(value) { shown = value },
        buttons: registeredButtons
    }
    setContext("dialog", context)

    $effect(() => {
        if (shown) {
            untrack(() => onopen())
            handle.showModal()
        } else {
            untrack(() => onclose())
            handle.close()
        }
    })

    // can the dialog be cancelled by the user right now?
    let cancellable = $derived(
        closable && !context.buttons.CANCEL?.isDisabled()
    )

    function cancel(evt) {
        if (!cancellable) {
            return
        }
        if (context.buttons.CANCEL) {
            // cancel button closes the dialog itself
            context.buttons.CANCEL.onclick(evt)
        } else {
            shown = false;
        }
    }

    // update shown state on dialog close
    onMount(
        evt => {
            // give parent window focus when dialog is shown
            handle.addEventListener("toggle", evt => {
                if (evt.newState === "open") {
                    // mark shown
                    shown = true;
                    // focus parent window
                    electron.windows.focus();
                } else {
                    // mark closed
                    shown = false
                }
            })
        }
    )

</script>

<dialog 
    id={id} 
    bind:this={handle}
    aria-labelledby={title}
    onkeydown={evt => {
        // escape should behave like the close button, unless already handled (e.g. by a nested dialog)
        if (evt.key === "Escape" && !evt.defaultPrevented && !evt.isComposing) {
            evt.preventDefault();
            cancel(evt);
        }
    }}
    class:shrink
>
    {#if shown}
        <div class="title">
            <label for={id}>{title}</label>
            <div class=gap></div>
            <div class=title-btns>
                {#if cancellable}
                    <button
                        id=close
                        onclick={cancel}
                        aria-label={translate("Close")}
                    >
                        <Icon 
                            src="/icons/sym-close.svg"
                            size=.75rem
                        />
                    </button>
                {/if}
            </div>
        </div>
        <div 
            class="content"
        >
            {@render children?.()}
        </div>
        <div class="buttons">
            {@render context.buttons.HELP?.snippet()}
            <div class=gap></div>
            {#if Array.isArray(buttons)}
                <!-- if given an array of roles, create default buttons for those roles -->
                {#each buttons as role}
                    <DialogButton role={role} />
                {/each}
            {:else}
                {@render buttons?.()}
            {/if}
            {@render context.buttons.YES?.snippet()}
            {@render context.buttons.NO?.snippet()}
            {@render context.buttons.OK?.snippet()}
            {@render context.buttons.APPLY?.snippet()}
            {#each context.buttons.OTHER as otherButton}
                {@render otherButton.snippet()}
            {/each}
            {@render context.buttons.CANCEL?.snippet()}
        </div>
    {/if}
</dialog>

<style>
    :root {
        --panel-padding: .5rem;
    }
    dialog:modal {
        display: grid;
    }
    dialog {
        grid-template-rows: [title] min-content [content] 1fr;
        overflow: hidden;
        resize: both;
        height: 80vh;
        width: max-content;
        max-height: 90vh;
        max-width: 90vw;
        min-width: calc-size(min-content, min(size, 80vw));
        min-height: calc-size(min-content, min(size, 80vh));
        background-color: var(--mantle);
        border-radius: .25rem;
        outline: none;
        padding: 0;
        border: 1px solid var(--outline);
    }
    dialog.shrink {
        height: fit-content;
        width: min-content;
    }
    dialog .content {
        position: relative;
        overflow-y: auto;
        color: var(--text);
        min-width: calc-size(min-content, min(size, 80vw));
    }
    dialog .title {
        display: grid;
        grid-template-columns: [title] max-content [gap] auto [close] min-content;
        align-items: stretch;
        justify-items: start;
        padding: .3em 1rem;
        background-color: var(--overlay);
        color: var(--text-on-overlay);
        padding: 0;
    }
    dialog .title label {
        padding: .5rem;
    }
    .title-btns button {
        margin: 0;
        height: 100%;
        width: 100%;
        padding: .5rem 1rem;
        margin: 0;
        border-radius: 0;
        background-color: var(--overlay);
        color: var(--text);
        line-height: 0;
    }
    .title-btns button:enabled:hover {
        background-color: var(--base);
        color: var(--text);
    }
    .title-btns button#close:enabled:hover {
        background-color: var(--red);
        color: var(--text-on-red);
    }

    .buttons {
        display: flex;
        flex-direction: row;
        gap: .5rem;
        padding: 1rem;
        padding-bottom: 2rem;
    }
    .gap {
        flex-grow: 1;
    }
</style>