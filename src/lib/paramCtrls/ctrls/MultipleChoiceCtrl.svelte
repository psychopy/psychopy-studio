<script>
    import { optionsFromParam } from "./utils.js";
    import { translate } from "$lib/translation";

    let {
        param=$bindable(),
        /** @prop @type {boolean} Controls whether this control is disabled */
        disabled=false,
        /** @interface */
        ...attachments
    } = $props()

    function validateMultiChoice(param, valid) {
        valid.value = !Array.isArray(param.allowedVals) || !Array.isArray(param.val) || param.val.every((val) => param.allowedVals.includes(val))
    }
</script>

<div
    class=param-multi-choice-input
    style:color={param.valid.value ? "inherit" : "var(--red)"}
    id={param.name}
    {@attach element => param.registerValidator("multiChoice", validateMultiChoice, 10)}
    {...attachments}
>
    {#await optionsFromParam(param)}
        {translate("Loading...")}
    {:then options}
        {#each options as [val, label]}
            <input
                type=checkbox
                id="{param.name}:{val}"
                bind:checked={
                    () => param.val.includes(val),
                    (value) => {
                        // make sure val is an array
                        if (typeof param.val === "string") {
                            param.val = []
                        }
                        if (value && !param.val.includes(val)) {
                            // if checked and value isn't in param, add it
                            param.val.push(val)
                        } else if (!value && param.val.includes(val)) {
                            // if unchecked and value is in param, remove it
                            param.val.splice(param.val.indexOf(val), 1)
                        }
                    }
                }
                disabled={disabled}
            />
            <label for="{param.name}:{val}">
                {label}
            </label>
        {/each}
    {:catch}
        {translate("Failed to load options.")}
    {/await}
    
</div>

<style>
    .param-multi-choice-input {
        flex-grow: 1;

        border: 1px solid var(--overlay);
        border-radius: .5rem;
        padding: .5rem;

        display: grid;
        grid-template-columns: [ctrls] 2rem [labels] 1fr;
        gap: .5rem;
        align-items: center;
    }
</style>
