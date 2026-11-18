<script>
    import { validateFont } from "./validators.svelte.js";
    import SingleLineCtrl from "./SingleLineCtrl.svelte";
    import { python } from "$lib/globals.svelte";
    import path from "path-browserify";
    import { getContext } from "svelte";
    import { Button } from "$lib/ui/button";
    import { FontManager, FontManagerDialog} from "$lib/dialogs/fontManager";
    import { translate } from "$lib/translation";

    let {
        /** @prop @type {import("$lib/experiment").Param} Param object to which this ctrl pertains */
        param=$bindable(),
        /** @prop @type {boolean} Controls whether this control is disabled */
        disabled=false,
        /** @interface */
        ...attachments
    } = $props()

    let current = getContext("current");
    // controls dialog visibility
    let show = $state({
        dialog: false
    })
    // scan all on init
    FontManager.all.refresh()
    // scan for fonts in experiment folder whenever it changes
    $effect(() => FontManager.experiment.refresh(current.experiment))
    

    let installed = $derived.by(() => {
        let found = false
        // iterate through sources
        for (let name of FontManager.all.fonts) {
            // does it (in lowercase with no spaces) match the param (in the same)?
            if (
                name.toLowerCase().replaceAll(" ", "") === String(param.val).toLowerCase().replaceAll(" ", "")
            ) {
                found = true
            }
        }

        return found
    })
</script>

<SingleLineCtrl
    bind:param={param}
    disabled={disabled}
    {@attach element => param.registerValidator("font", (param, valid) => validateFont(param, valid, installed), 5)}
    {...attachments}
/>
{#if python?.ready}
    <Button
        icon="/icons/btn-case.svg"
        tooltip={translate("Open font manager")}
        awaiting={FontManager.all.scanning}
        onclick={evt => show.dialog = true}
        small
    />
    <!-- font manager dialog -->
    <FontManagerDialog 
        bind:value={param.val}
        buttonsDisabled={{
            OK: !param.valid,
            APPLY: !param.valid
        }}
        bind:shown={show.dialog}
    />
{/if}