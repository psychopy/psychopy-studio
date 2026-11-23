<script>
    import { validateConditions } from "./validators.svelte.js";
    import TableCtrl from "./TableCtrl.svelte";
    import { python } from "$lib/globals.svelte";
    import { current } from "../../../../routes/builder/globals.svelte";
    import Info from "$lib/ui/tooltip/Info.svelte";
    import Tooltip from "$lib/ui/tooltip/Tooltip.svelte";
    import { slide } from "svelte/transition";
    import { translate } from "$lib/translation";

    let {
        /** @prop @type {import("$lib/experiment").Param} Param object to which this ctrl pertains */
        param=$bindable(),
        /** @prop @type {boolean} Controls whether this control is disabled */
        disabled=false,
        /** @interface */
        ...attachments
    } = $props()

</script>

<div class=wrapper>
    <TableCtrl
        param={param}
        disabled={disabled}
        {@attach element => param.registerValidator("conditions", validateConditions, 5)}
        {...attachments}
    />
    <div class=output>
        {#if param.val}
            {#await python.liaison.send("app", {
                command: "try",
                args: [
                    "psychopy.data.utils:importConditions"
                ],
                kwargs: {
                    fileName: current.experiment.relativePath(param.val),
                    returnFieldNames: true
                }
            })}
                {translate("Loading...")}
            {:then resp}
                {#if resp.success}
                    {translate("{} conditions, with {} parameters").replace("{}", resp.result[0].length).replace("{}", resp.result[1].length)} 
                    <Info>
                        {resp.result[1].join(", ")}
                    </Info>
                {/if}
            {:catch err}
                {""}
            {/await}
        {/if}
    </div>
</div>

<style>
    .wrapper {
        flex-grow: 1;
        display: grid;
        grid-template-columns: 1fr min-content min-content;
        grid-template-rows: min-content min-content;
        gap: .5rem;
    }

    .output {
        position: relative;
        display: flex;
        flex-direction: row;
        gap: .5rem;
        align-items: center;
        padding: 0 .5rem;
    }
</style>