<script>
    import ChoiceCtrl from "./ctrls/ChoiceCtrl.svelte";
    import SingleLineCtrl from "./ctrls/SingleLineCtrl.svelte";
    import Tooltip from "$lib/utils/tooltip/Tooltip.svelte";

    let {
        valueParam=$bindable(),
        typeParam=$bindable(),
        expectedParam=$bindable()
    } = $props()

    let showTooltip = $state.raw(false)
</script>

<div class=start-stop-ctrl id={valueParam?.name}>
    {#if valueParam}
        <label 
            class=param-label 
            for={valueParam.name}
            onmouseenter={evt => showTooltip = true}
            onmouseleave={evt => showTooltip = false}
            onfocusin={evt => showTooltip = true}
            onfocusout={evt => showTooltip = false}
        >
            {#if valueParam?.hint}
                <Tooltip
                    bind:shown={showTooltip}
                    position=right
                >
                    {valueParam.hint}
                </Tooltip>
            {/if}
            {valueParam.label}
        </label>
    {/if}
    <div class=param-gap></div>
    {#if typeParam}
        <div class=param-type>
            {#if typeParam.hint}
                <Tooltip>
                    {typeParam.hint}
                </Tooltip>
            {/if}
            <select 
                aria-label={typeParam.label}
                bind:value={typeParam.val}
                disabled={typeParam.allowedVals.length == 1}
            >
                {#each typeParam.allowedVals as val}
                    <option value={val} selected={typeParam.val === val}>{val}</option>
                {/each}
            </select>
        </div>
    {/if}
    {#if valueParam}
        <input 
            class=param-value 
            type="text" 
            id={valueParam.name}
            bind:value={valueParam.val} 
        />
    {/if}
    {#if expectedParam !== null}
        <label 
            class=param-estim-label 
            for={expectedParam?.name}
        >
            {expectedParam.label}
        </label>
        <input 
            class=param-estim 
            type="text" 
            bind:value={expectedParam.val} 
            id={expectedParam?.name}
        />
    {/if}
</div>

<style>
    .start-stop-ctrl {
        display: grid;
        grid-template-columns: [before] min-content [label] min-content [ctrl] auto [end];
        grid-template-rows: [label] min-content [ctrl] auto [estim] auto;
        grid-gap: .5rem;
        align-items: end;
        min-width: 20rem;
        color: var(--text);
    }

    .start-stop-ctrl .param-label {
        position: relative;
        grid-column-start: label;
        grid-row-start: label;
        align-content: end;
    }
    .start-stop-ctrl .param-gap {
        grid-column-start: ctrl;
        grid-column-end: end;
        grid-row-start: label;
    }
    .start-stop-ctrl .param-type {
        position: relative;
        grid-column-start: label;
        grid-row-start: ctrl;
    }
    .start-stop-ctrl .param-type select {
        width: 100%;
        min-width: 8rem;
        color: var(--text);
    }
    .start-stop-ctrl .param-value {
        grid-column-start: ctrl;
        grid-row-start: ctrl;
        color: var(--text);
    }
    .start-stop-ctrl .param-estim-label {
        position: relative;
        grid-column-start: label;
        grid-row-start: estim;
        align-self: center;
        justify-self: end;
        padding: 0 .5rem;
        white-space: nowrap;
        opacity: 50%;
    }
    .start-stop-ctrl .param-estim {
        grid-column-start: ctrl;
        grid-row-start: estim;
        color: var(--text);
    }
</style>