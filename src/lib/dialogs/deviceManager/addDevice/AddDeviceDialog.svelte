<script>
    import { Dialog } from "$lib/utils/dialog";
    
    import { CompactButton, PanelButton } from "$lib/utils/buttons";
    import { sanitizeImportString } from "$lib/utils/tools/imports.js";
    import DeviceListItem from "./DeviceListItem.svelte";
    import { ParamCtrl } from "$lib/paramCtrls";
    import { Device, Param } from "$lib/experiment"
    import { setContext } from "svelte";
    import { devices, python } from "$lib/globals.svelte";
    import { pending as profilesPending, profiles } from "$lib/experiment/profiles.svelte";
    import { translate } from "$lib/translation";

    let {
        shown=$bindable()
    } = $props()

    let selection = $state.raw();

    let param = new Param("Device label")
    param.valType = "code"
    param.inputType = "name"

    let panelsOpen = $state({})

    let timeout = $state.raw(60000)

    function refresh(evt) {
        profilesPending.devices.resolve(
            python.liaison.send("app", {
                command: "run",
                args: [
                    "psychopy.experiment:getDeviceProfiles"
                ]
            }).then(
                resp => Object.assign(profiles.devices, resp)
            )
        )
    }

    let disableBtns = $derived({
        OK: !param.valid.value || !selection
    })

</script>

<Dialog
    id=add-device
    title={translate("Add device...")}
    bind:shown={shown}
    onopen={evt => {
        // no name
        param.val = ""
        // nothing selected
        selection = undefined;
        // close all panels
        for (let key in panelsOpen) {
            panelsOpen[key] = false;
        }
    }}
    buttons={{
        OK: (evt) => {
            // populate
            devices[param.val] = new Device(selection.backend.__name__, selection.device);
            devices[param.val].params['name'].val = param.val;
        },
        CANCEL: (evt) => {}
    }}
    buttonsDisabled={disableBtns}
>
    <div class=container>
        <ParamCtrl
            name={param.name}
            param={param}
        ></ParamCtrl>
        <div 
            class=label
            style:margin-bottom="-.5rem"
        >
            <span style:flex-grow={1}>Available devices</span>
            <CompactButton
                icon="/icons/btn-refresh.svg"
                tooltip={translate("Refresh")}
                onclick={refresh}
            />
        </div>
        <div class=devices-list>
            {#await profilesPending.devices.promise}
                <div class=loading-msg>
                    {translate("Getting device backends...")}
                </div>
            {:then}
                {#if profiles.devices}
                    {#each Object.values(profiles.devices).filter(profile => profile.device) as backend}
                        {#await python.liaison.send("app", {
                            command: "run",
                            args: ["psychopy.hardware.manager:DeviceManager.getAvailableDevices", sanitizeImportString(backend.device)]
                        }, timeout)}
                            <PanelButton
                                label={translate(`Getting {} devices...`).replace("{}", backend.label)}
                                open={false}
                            />
                        {:then deviceProfiles}
                            {#if deviceProfiles.length}
                                <PanelButton
                                    label={backend.label}
                                    bind:open={panelsOpen[backend.__name__]}
                                >
                                    <div class=device-category>
                                        {#each Object.values(deviceProfiles) as device}
                                            <DeviceListItem
                                                bind:selection={selection}
                                                device={device}
                                                backend={backend}
                                            />
                                        {/each}
                                    </div>
                                </PanelButton>
                            {/if}
                        {:catch err}
                            <div class=timeout-msg>
                                <p>{translate("Getting available devices took longer than expected.")}</p>
                                <pre>
{err.error.join("\n")}
                                </pre>
                                
                                <p>{translate("Try again with a longer wait time (in milliseconds)?")}</p>
                                <div class=retry>
                                    <input 
                                        type=number 
                                        style:flex-grow={1}
                                        bind:value={timeout} 
                                    />
                                    <CompactButton
                                        icon="/icons/btn-refresh.svg"
                                        tooltip={translate("Retry")}
                                        onclick={refresh}
                                    />
                                </div>
                            </div>
                        {/await}
                    {/each}
                {/if}
            {:catch err}
                {console.error(err)}
            {/await}
        </div>
    </div>
</Dialog>

<style>
    .container {
        display: flex;
        flex-direction: column;
        padding: 1rem;
        gap: 1rem;
        height: 100%;
        box-sizing: border-box;
        width: 45rem;
    }
    .devices-list {
        background-color: var(--base);
        border: 1px solid var(--overlay);
        overflow-y: auto;
        padding-bottom: 10rem;
        height: 100%;
    }
    .device-category {
        display: flex;
        flex-direction: column;
        gap: .5rem;
        padding: 1rem;
        padding-top: .5rem;
    }
    .loading-msg {
        padding: 1rem;
    }

    .timeout-msg {
        padding: 1rem;
    }
    .timeout-msg pre {
        overflow: auto;
    }
    .timeout-msg .retry {
        display: flex;
        flex-direction: row;
        gap: .5rem;
    }

    .label {
        display: flex;
        flex-direction: row;
        gap: .5rem;
        align-items: end;
    }
</style>