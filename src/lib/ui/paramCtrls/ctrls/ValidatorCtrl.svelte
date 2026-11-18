<script>
    import { validateValidator } from "./validators.svelte.js";
    import { getContext } from "svelte";
    import { translate } from "$lib/translation";

    let {
        param=$bindable(),
        /** @prop @type {boolean} Controls whether this control is disabled */
        disabled=false,
        /** @interface */
        ...attachments
    } = $props()

    let current = getContext("current")

    let options = $derived.by(() => {
        let output = [];

        // iterate through routines
        for (let [name, rt] of Object.entries(current.experiment.routines)) {
            if (param.allowedVals.includes(rt.tag)) {
                output.push(name)
            }
        }

        return output
    })
</script>

<select 
    class=param-validator-input
    disabled={disabled || options.length === 0} 
    bind:value={param.val}
    style:color={param.valid.value ? "inherit" : "var(--red)"}
    id={param.name}
    aria-label={param.label}
    {@attach element => param.registerValidator("validator", (param, valid) => validateValidator(param, valid, options), 0)}
    {...attachments}
>
    <option
        value=""
        selected={param.val === ""}
    >
        {translate("Do not validate")}
    </option>
    {#each options as option}
        <option 
            value={option} 
            selected={param.val === option}
        >{option}</option>
    {/each}
</select>

<style>
    .param-validator-input {
        flex-grow: 1;
    }
</style>
