<script>
    import SingleLineCtrl from "./SingleLineCtrl.svelte";
    import { python } from "$lib/globals.svelte";
    import path from "path-browserify";
    import { getContext } from "svelte";
    import { CompactButton } from "$lib/utils/buttons";
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

    function validateFont(param, valid) {
        // allow no font
        if (!param.val) {
            return
        }
        // vary the warning according to whether we're on local
        if (!installed) {
            if (python?.ready) {
                valid.warning = `Font '${param.val}' is not installed. Try installing it via the Font Manager.`
            } else {
                valid.warning = `Font '${param.val}' is not web safe.`
            }
        }
        
    }
</script>

<SingleLineCtrl
    bind:param={param}
    disabled={disabled}
    {@attach element => param.registerValidator("font", validateFont, 5)}
    {...attachments}
/>
{#if python?.ready}
    <CompactButton 
        icon="/icons/btn-case.svg"
        tooltip={translate("Open font manager")}
        awaiting={FontManager.all.scanning}
        onclick={evt => show.dialog = true}
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