<script>
    import TableCtrl from "./TableCtrl.svelte";
    import { python } from "$lib/globals.svelte";
    import { current } from "../../../routes/builder/globals.svelte";
    import Info from "$lib/utils/tooltip/Info.svelte";
    import Tooltip from "$lib/utils/tooltip/Tooltip.svelte";
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

    function validateConditions(param, valid) {
        return
    }

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
                Loading...
            {:then resp}
                {#if resp.success}
                    {resp.result[0].length} conditions, with {resp.result[1].length} parameters 
                    <Info>
                        <div 
                            class=more-info
                            transition:slide={{axis: "x", delay: 0.5}}
                        >
                            {resp.result[1].join(", ")}
                        </div>
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

    .more-info {
        position: absolute;
        left: 1rem;
        padding: .25rem .5rem;
        border-radius: .5rem;
        background-color: var(--outline);
        color: var(--text-on-outline);
        overflow: hidden;
        text-wrap: nowrap;
        max-width: 35rem;
    }
</style>