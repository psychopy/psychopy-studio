<script>
    import { devices, python } from "$lib/globals.svelte";
    import { DeviceManagerDialog } from "$lib/dialogs/deviceManager"
    import { CompactButton } from "$lib/utils/buttons";
    import { translate } from "$lib/translation";
    import { profiles } from "$lib/experiment";

    let {
        param=$bindable(),
        /** @prop @type {boolean} Controls whether this control is disabled */
        disabled=false,
        /** @interface */
        ...attachments
    } = $props()

    function validateDevice(param, valid) {
        if (options.length) {
            valid.value = options.includes(param.val) || param.val === ""
        } else {
            valid.value = true
            // get allowed device types
            let deviceTypes = []
            for (let target of param.allowedVals) {
                deviceTypes.push(
                    ...Object.values(profiles.devices).filter(
                        profile => target.endsWith(profile.__class__)
                    ).map(
                        profile => profile.label || profile.__name__
                    )
                )
            }
            // construct string from allowed device types
            if (deviceTypes.length == 0) {
                valid.warning = translate(
                    "No relevant devices added, use device manager to add devices."
                )
            } else if (deviceTypes.length == 1) {
                valid.warning = translate(
                    "No {} devices added, use device manager to add {} devices.\n"
                ).replaceAll("{}", deviceTypes[0])
            } else {
                valid.warning = translate(
                    "No relevant devices added, use device manager to add devices.\n\nRelevant devices are: "
                ) + deviceTypes.join(", ")
            }
        }
    }

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
    {@attach element => param.registerValidator("device", validateDevice, 0)}
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
    <CompactButton
        icon="/icons/btn-devices.svg"
        onclick={(evt) => showDialog = true}
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