<script>
    import { optionsFromParam } from "./utils.js";

    let {
        param=$bindable(),
        /** @prop @type {boolean} Controls whether this control is disabled */
        disabled=false,
        /** @interface*/
        ...attachments
    } = $props()

    $effect(() => {
        if (param.isCodeType && typeof param.val === "string") {
            // parse integers if necessary
            if (param.val.match(/^\d+$/)) {
                param.val = parseInt(param.val)
            }
        }
    })

    function validateChoice(param, valid) {
        if (Array.isArray(param.allowedVals) && !param.allowedVals.includes(param.val)) {
            valid.warning = `${param.val} not in list of allowed values`
        }
    }
</script>


<select 
    class=param-choice-input
    id={param.name}
    disabled={disabled || param.allowedVals.length == 1 && param.allowedVals.includes(param.val)} 
    bind:value={param.val}
    style:color={param.valid.value ? "inherit" : "var(--red)"}
    {@attach element => param.registerValidator("choice", validateChoice, 0)}
    {...attachments}
>
    {#await optionsFromParam(param)}
        <option>Loading...</option>
    {:then options}
        {#each options as [val, label]}
            <option 
                value={val} 
                selected={param.val === val}
            >{label}</option>
        {/each}
    {:catch}
        <option 
            value={param.val} 
            selected
        >{param.val}</option>
    {/await}
</select>


<style>
    .param-choice-input {
        flex-grow: 1;
    }
</style>
