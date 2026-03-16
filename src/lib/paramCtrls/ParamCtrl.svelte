<script>
    import { mapping } from "./ctrls";
    import Tooltip from "$lib/utils/tooltip/Tooltip.svelte";
    import { current } from "../../routes/builder/globals.svelte";
    import { translate } from "$lib/translation";

    let {
        name,
        param=$bindable(),
        /** @interface */
        ...attachments
    } = $props();

    let ValueCtrl = $state.raw();
    if (param.inputType in mapping) {
        ValueCtrl = mapping[param.inputType]
    } else {
        ValueCtrl = mapping["single"]
    }

    // some ctrls need to be inline rather than underneath the label
    let inline = $derived(
        ["bool"].includes(param.inputType)
    )

    function evaluateDepend(dep) {
        let target
        // if dep is just a boolean, treat is as a forced outcome
        if (typeof dep === "boolean") {
            return dep
        }
        // evaluate condition
        if (String(dep.condition).startsWith("==")) {
            // equal to something...
            target = String(dep.condition).replace(/== *['"](.*?)['"]|== *(.*?)/, "$1")
            // convert True/False to true/false
            if (target.trim() === "True") {
                target = true
            } else if (target.trim() === "False") {
                target = false
            }
            // evaluate
            if (param.siblings[dep.param].val !== target) {
                return false
            }
        } else if (String(dep.condition).startsWith("in")) {
            // within an array...
            target = String(dep.condition).replace(
                /in [\[\(](.*?)[\]\)]/, "$1"
            ).split(
                /, ?/g
            ).map(
                (value) => value.replace(/['"](.*?)['"]/, "$1")
            )
            // evaluate
            if (!target.includes(param.siblings[dep.param].val)) {
                return false
            }
        } else {
            // evaluate value itself
            if (!param.siblings[dep.param].val) {
                return false
            }
        }

        return true
    }

    let shown = $derived.by(() => {
        // iterate through dependencies controlling shown state
        for (let dep of param.depends.shown) {
            // evaluate each
            if (!evaluateDepend(dep)) {
                return false
            }
        }

        return true
    })

    let enabled = $derived.by(() => {
        // iterate through dependencies controlling shown state
        for (let dep of param.depends.enabled) {
            // evaluate each
            if (!evaluateDepend(dep)) {
                return false
            }
        }

        return true
    })

    let showTooltip = $state.raw(false);

    let grow = $derived(
        ["code", "multi"].includes(param.inputType)
    )
</script>

{#if shown && param.inputType !== "hidden"}
    <div 
        class=param-ctrl 
        id={param.name}
        style:grid-template-rows={inline ? "[label] min-content [warning] min-content" : "[label] min-content [ctrl] auto [warning] min-content"}
        style:flex-grow={grow ? 1 : 0}
        {...attachments}
    >
        <label 
            class=param-label 
            for={param.name}
            style:grid-column-start={inline ? "gap" : "label"}
            style:align-self={inline ? "center" : "end"}
            onmouseenter={(evt) => showTooltip = true}
            onmouseleave={(evt) => showTooltip = false}
            onfocusin={(evt) => showTooltip = true}
            onfocusout={(evt) => showTooltip = false}
        >
            {param.label ? param.label : name}
            {#if param.hint}
                <Tooltip
                    bind:shown={showTooltip}
                    position=bottom
                >
                    {param.hint}
                </Tooltip>
            {/if}
        </label>
        {#if param.allowedUpdates && param.allowedUpdates.length > 0}
            <select 
                class=param-updates 
                id="{name}-updates" 
                disabled={param.allowedUpdates.length == 1} 
                bind:value={param.updates}
                aria-label="{name} updates"
            >
                {#each param.allowedUpdates as ud}
                    <option value={ud}>{ud}</option>
                {/each}
                {#each current.experiment.updateTargets as ud}
                    <option value="set during: {ud.name}">
                        {translate("set during: {}").replace("{}", ud.name)}
                    </option>
                {/each}
            </select>
        {/if}
        <div 
            class="param-value"
            style:grid-row-start={inline ? "label" : "ctrl"}
            style:grid-column-end={inline ? "gap" : "end"}
        >
            <ValueCtrl 
                bind:param={param}
                disabled={!enabled}
            ></ValueCtrl>
        </div>
        <div 
            class=warning
        >
            {#if param.valid.warning}
                {param.valid.warning}
            {/if}
        </div>
    </div>
{/if}

<style>
    .param-ctrl {
        display: grid;
        grid-template-columns: [label] max-content [gap] 1fr [updates] min-content [end];
        grid-gap: .5rem;
        align-items: center;
        min-width: 20rem;
        box-sizing: border-box;
        color: var(--text);
    }
    .param-ctrl .param-label {
        position: relative;
        grid-row-start: label;
    }
    .param-ctrl .param-updates {
        grid-column-start: updates;
        grid-row-start: label;
        color: var(--text);
    }

    .param-ctrl#name {
        grid-row-start: 1;
    }

    .param-value {
        grid-column-start: label;
        display: flex;
        gap: .5rem;
        flex-direction: row;
        align-items: stretch;
        height: 100%;
    }

    .warning {
        color: var(--red);
        grid-row-start: warning;
        grid-column-start: label;
        grid-column-end: end;
        justify-self: end;
        margin-top: -.25rem;
    }
</style>