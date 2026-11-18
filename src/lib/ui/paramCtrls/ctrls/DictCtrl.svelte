<script>
    import { validateDict } from "./validators.svelte.js";
    import { translate } from "$lib/translation";
    import { Button } from "$lib/ui/button";
    import { iterateName } from "./utils.svelte.js";
    import { sanitizeJSON } from "$lib/utils/transpiler"

    let {
        param=$bindable(),
        /** @prop @type {boolean} Controls whether this control is disabled */
        disabled=false,
        /** @interface */
        ...attachments
    } = $props()

    // make sure param val is always an object rather than a string
    $effect(() => {
        if (typeof param.val === "string") {
            // sanitize value
            let value = sanitizeJSON(param.val)
            // parse JSON
            try {
                param.val = JSON.parse(value)
            } catch {
                console.warn(`Failed to parse '${value}' as JSON`)
                param.val = {}
            }
        }
    })
</script>

<div 
    class=dict-ctrl-layout
    id={param.name}
    {@attach element => param.registerValidator("dict", validateDict, 0)}
    {...attachments}
>
    {#if typeof param.val === "object"}
        {#each Object.keys(param.val) as key}
            <input
                bind:value={
                    () => key,
                    (value) => {
                        // iterate name to avoid duplication
                        while (value in param.val) {
                            value = iterateName(value)
                        }
                        // get keys and values in param val
                        let keys = Object.keys(param.val);
                        let values = Object.values(param.val)
                        // switch out name
                        keys[keys.indexOf(key)] = value;
                        // clear param val
                        param.val = {}
                        // apply new key:value pairs
                        for (let i in keys) {
                            param.val[keys[i]] = values[i]
                        };
                    }
                }
                aria-label={translate("Name of {} key").replace("{}", param.label)}
                data-testid=dict-key
                class:valid={param.valid.value} 
                disabled={disabled}
            />
            <span
                class=dict-ctrl-label
            >
                :
            </span>
            <span 
                class=code-indicator
            >
                $
            </span>
            <input 
                bind:value={param.val[key]}
                class:valid={param.valid.value} 
                class:code={param.isCode} 
                aria-label={translate("Starting value of {key} in {param}").replace("{key}", key).replace("{param}", param.label)}
                data-testid="dict-value:{key}"
            />
            <Button
                icon="/icons/btn-delete.svg"
                onclick={(evt) => {
                    delete param.val[key]
                }}
                disabled={disabled}
                tooltip={translate("Remove item")}
                data-testid=remove-item
                small
            />
        {/each}
    {/if}
    <div class=gap></div>
    <div class=gap></div>
    <div class=gap></div>
    <div class=gap></div>
    <Button
        icon="/icons/btn-add.svg"
        onclick={(evt) => {
            // enumerate field name to avoid duplication
            let key = "field";
            while (key in param.val) {
                key = iterateName(key)
            }
            // add field
            param.val[key] = "";
        }}
        tooltip={translate("Add item")}
        data-testid=add-item
        disabled={disabled}
        small
    />
</div>

<style>
    .dict-ctrl-layout {
        flex-grow: 1;
        display: grid;
        grid-template-columns: [key] auto [colon] min-content [value] min-content auto [delete] min-content;
        gap: .5rem;
    }
    .dict-ctrl-label {
        align-self: center;
        justify-self: end;
        font-family: var(--mono);
        color: var(--outline)
    }

    input {
        color: var(--text);
    }
    input:not(.valid) {
        color: var(--red);
    }
    input.code {
        font-family: var(--mono);
        font-weight: bold;
    }
    .code-indicator {
        align-self: center;
        margin-right: -.25rem;
    }
</style>