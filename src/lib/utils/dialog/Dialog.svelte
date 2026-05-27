<script>
    import { Button } from "$lib/utils/buttons";
    import { Icon } from "$lib/utils/icons";
    import { onMount, untrack } from "svelte";
    import { translate } from "$lib/translation";

    let {
        id,
        /** @prop @type {string} Text to display in the title bar of this dialog */
        title="",
        /** @prop @type {OK: function|undefined, APPLY: function|undefined, CANCEL: function|undefined, HELP: string|undefined} Standard dialog buttons to display, with additional callback functions (or navigation link, in the case of HELP) */
        buttons={
            OK: undefined,
            APPLY: undefined,
            YES: undefined,
            NO: undefined,
            CANCEL: undefined,
            HELP: undefined,
            EXTRA: [],
        },
        /** @bindable State controlling whether each button is disabled */
        buttonsDisabled={},
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

    $effect(() => {
        if (shown) {
            untrack(() => onopen())
            handle.showModal()
        } else {
            untrack(() => onclose())
            handle.close()
        }
    })

    // update shown state on dialog close
    onMount(
        evt => handle.addEventListener("close", evt => shown = false)
    )

</script>

<dialog 
    id={id} 
    bind:this={handle}
>
    {#if shown}
        <div class="title">
            <label for={id}>{title}</label>
            <div class=gap></div>
            <div class=title-btns>
                {#if closable}
                    <button 
                        id=close
                        onclick={(evt) => {
                            shown = false;
                            if (buttons.CANCEL) {
                                buttons.CANCEL(evt)
                            }
                        }}
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
            style:height={shrink ? "fit-content" : "80vh"}
        >
            {@render children?.()}
        </div>
        <div class="buttons">
            <div class="btn-array extra">
                {#if buttons.HELP}
                    <Button 
                        label={translate("Help")}
                        onclick={() => {
                            window.open(buttons.HELP, '_blank').focus();
                        }} 
                        horizontal
                    />
                {/if}
            </div>
            <div class=gap></div>
            <div class="btn-array standard">
                {#if buttons.YES}
                <Button 
                    label={translate("Yes")}
                    onclick={(evt) => {
                        buttons['YES'](evt);
                        shown = false;
                    }} 
                    affirmative
                    horizontal
                    disabled={buttonsDisabled && buttonsDisabled['YES']}
                />
                {/if}
                {#if buttons.NO}
                <Button 
                    label={translate("No")}
                    onclick={(evt) => {
                        buttons['NO'](evt);
                        shown = false;
                    }} 
                    horizontal
                    negative
                    disabled={buttonsDisabled && buttonsDisabled['NO']}
                />
                {/if}
                {#if buttons.OK}
                <Button 
                    label={translate("OK")}
                    onclick={(evt) => {
                        buttons['OK'](evt);
                        shown = false;
                    }} 
                    primary
                    horizontal
                    disabled={buttonsDisabled && buttonsDisabled['OK']}
                />
                {/if}
                {#if buttons.APPLY}
                <Button 
                    label={translate("Apply")}
                    onclick={(evt) => {
                        buttons['APPLY'](evt); 
                    }} 
                    horizontal
                    disabled={buttonsDisabled && buttonsDisabled['APPLY']}
                />
                {/if}
                {#if buttons.EXTRA}
                    {#each Object.entries(buttons['EXTRA']) as [label, onclick]}
                        <Button
                            label={label}
                            onclick={onclick}
                            horizontal
                            disabled={buttonsDisabled && buttonsDisabled['EXTRA'] && buttonsDisabled['EXTRA'][label]}
                        />
                    {/each}
                {/if}
                {#if buttons.CANCEL}
                <Button 
                    label={translate("Cancel")}
                    onclick={(evt) => {
                        buttons['CANCEL'](evt); 
                        shown = false;
                    }} 
                    horizontal
                    disabled={buttonsDisabled && buttonsDisabled['CANCEL']}
                />
                {/if}
            </div>
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
        background-color: var(--mantle);
        border-radius: .25rem;
        outline: none;
        padding: 0;
        border: 1px solid var(--outline);
        min-width: fit-content;
        height: fit-content;
        resize: horizontal;
    }
    dialog .content {
        position: relative;
        overflow-y: auto;
        color: var(--text);
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
        display: grid;
        grid-template-columns: [extra] min-content [gap] auto [standard] min-content;
        padding: 1rem;
        padding-bottom: 2rem;
    }
    .btn-array {
        display: flex;
        flex-direction: row;
        gap: 1rem;
    }
</style>