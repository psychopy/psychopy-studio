<script>
    import Dialog from "$lib/ui/dialog/Dialog.svelte";
    import { DialogButton } from "$lib/ui/dialog";
    import { ParamsNotebook } from "$lib/ui/paramCtrls/index.js";
    import { translate } from "$lib/translation";

    let {
        /** @prop @type {import("$lib/experiment/param.svelte.js")<HasParams>} Element which this dialog edits */
        element,
        /** @bindable State controlling this dialog's visibility */
        shown=$bindable(),
        /** @prop @type {object} Additional buttons beyond the standard OK, APPLY, CANCEL and HELP */
        extraButtons={},
        /** @prop @type {function} Function to execute when param changes are applied */
        onapply=(evt) => {},
        /** @prop @type {function} Function to execute when this dialog closes */
        onclose=(evt) => {}
    } = $props()

    let valid = $derived(
        Object.values(element.params).every(
            param => param.valid.value
        )
    )    

    let btnsDisabled = $derived({
        OK: !valid,
        APPLY: !valid
    })

    function apply(evt) {
        element.trim();
        element.restore.set();
        onapply(evt);
    }

</script>


<Dialog 
    data-testid="{element.name}-parameters"
    title={`${translate("Editing")}: ${element.name || element.tag}`}
    bind:shown={shown} 
    onclose={onclose}
    onopen={() => element.restore.set()}
>
    <ParamsNotebook 
        element={element}
    />
    {#snippet buttons()}
        <DialogButton
            action=OK
            onclick={apply}
            disabled={btnsDisabled.OK}
        />
        <DialogButton
            action=APPLY
            onclick={apply}
            disabled={btnsDisabled.APPLY}
        />
        {#each Object.entries(extraButtons) as [label, onclick]}
            <DialogButton
                label={label}
                onclick={onclick}
            />
        {/each}
        <DialogButton
            action=CANCEL
            onclick={evt => {
                element.restore.apply()
            }}
        />
        {#if element.helpLink}
            <DialogButton
                action=HELP
                onclick={element.helpLink}
            />
        {/if}
    {/snippet}
</Dialog>