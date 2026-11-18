<script>
    import { validateDevice } from "./validators.svelte.js";
    import { devices, python } from "$lib/globals.svelte";
    import { DeviceManagerDialog } from "$lib/dialogs/deviceManager"
    import { Button } from "$lib/ui/button";
    import { translate } from "$lib/translation";

    let {
        param=$bindable(),
        /** @prop @type {boolean} Controls whether this control is disabled */
        disabled=false,
        /** @interface */
        ...attachments
    } = $props()

    let options = $derived.by(() => {
        let output = [];
        // iterate through devices
        for (let [name, device] of Object.entries(devices)) {
            // iterate through allowed device classes
            for (let target of param.allowedVals) {
                // if device is allowed, add it
                if (String(target).endsWith(device.tag)) {
                    output.push(name);
                }
            }
        }
        // if param.val isn't in options, add it
        if (param.val !== "" && !output.includes(param.val)) {
            output.push($state.snapshot(param.val))
        }

        return output
    })

    let showDialog = $state.raw(false)
</script>


<select 
    class=param-device-input
    disabled={disabled || options.length === 0} 
    id={param.name}
    bind:value={param.val}
    style:color={param.valid.value ? "inherit" : "var(--red)"}
    aria-label={param.label}
    {@attach element => param.registerValidator("device", (param, valid) => validateDevice(param, valid, options), 0)}
    {...attachments}
>
    <option
        value=""
        selected={param.val === ""}
    >{translate("Default")}</option>
    {#each options as option}
        <option 
            value={option} 
            selected={param.val === option}
        >{option}</option>
    {/each}
</select>

{#if python?.ready}
    <Button
        icon="/icons/btn-devices.svg"
        onclick={(evt) => showDialog = true}
        small
    />

    <DeviceManagerDialog
        bind:shown={showDialog}
    />
{/if}


<style>
    .param-device-input {
        flex-grow: 1;
    }
</style>