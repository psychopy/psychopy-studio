<script>
    import { translate } from "$lib/translation";
    import { CompactButton } from "$lib/utils/buttons";
    import { iterateName } from "./utils.js";
    import { sanitizeJSON } from "$lib/utils/transpiler"

    let {
        param=$bindable(),
        /** @prop @type {boolean} Controls whether this control is disabled */
        disabled=false,
        /** @interface */
        ...attachments
    } = $props()

    function validateDict(param, valid) {
        // skip if param.val is still as a string
        if (typeof param.val === "string") {
            return
        }
        // create array of validation objects for each entry
        let validation = []
        // iterate through keys and values
        for (let [key, val] of Object.entries(param.val)) {
            // create validation object for key and value
            let valid = {
                key: {
                    value: true,
                    warning: undefined
                },
                value: {
                    value: true,
                    warning: undefined
                }
            }
            // if key is duplicate, mark invalid
            if (Object.keys(param.val).filter(item => item === key).length > 1) {
                valid.key.value = false
                valid.key.warning = translate("Duplicate field name: {}").replace("{}", key)
            }
            // append validation object
            validation.push(valid)
        }
        // combine valid on all child items
        valid.value = validation.every(
            valid => valid.key.value && valid.value.value
        ) 
        // combine warnings from child items
        valid.warning = validation.flatMap(
            valid => [valid.key.warning, valid.value.warning]
        ).join("\n")
    }
    
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
            />
            <CompactButton
                icon="/icons/btn-delete.svg"
                onclick={(evt) => {
                    delete param.val[key]
                }}
                disabled={disabled}
                tooltip={translate("Remove item")}
            />
        {/each}
    {/if}
    <div class=gap></div>
    <div class=gap></div>
    <div class=gap></div>
    <div class=gap></div>
    <CompactButton
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
        disabled={disabled}
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