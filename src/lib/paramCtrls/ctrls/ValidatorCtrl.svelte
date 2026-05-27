<script>
    import { getContext } from "svelte";
    import { translate } from "$lib/translation";

    let {
        param=$bindable(),
        /** @prop @type {boolean} Controls whether this control is disabled */
        disabled=false,
        /** @interface */
        ...attachments
    } = $props()

    function validateValidator(param, valid) {
        if (options.length) {
            valid.value = options.includes(param.val) || param.val === ""
        } else {
            valid.value = true
            valid.warning = translate(
                "No validators added, add one via the Validation section of the Components panel."
            )
        }
    }

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
    {@attach element => param.registerValidator("validator", validateValidator, 0)}
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
