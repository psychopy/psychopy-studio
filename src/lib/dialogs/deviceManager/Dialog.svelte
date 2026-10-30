<script>
    import { Dialog, DialogButton } from "$lib/ui/dialog";
    import DeviceDetails from "./DeviceDetails.svelte";
    import { ListDetail, ListDetailItem } from "$lib/ui/listdetail";
    import { Button } from "$lib/ui/button";
    import { Device } from "$lib/experiment";
    import { devices, electron } from "$lib/globals.svelte";
    import AddDeviceDialog from "./addDevice/AddDeviceDialog.svelte";
    import { profiles } from "$lib/experiment/profiles.svelte";
    import { onMount } from "svelte";
    import { translate } from "$lib/translation";

    let {
        /** @bindable @type {boolean} State controlling when this dialog is shown */
        shown=$bindable()
    } = $props()

    function className(name) {
        return String(name).match(/(?<=\.)\w+$/)?.[0]
    }

    // track selected device
    let currentDevice = $state.raw(undefined)

    let showAddDeviceDialog = $state.raw(false)

    let valid = $derived(
        Object.values(devices).every(
            element => Object.values(element.params).every(
                param => param.valid.value
            )
        )
    )

    let restore = {
        devices: {},
        set: () => {
            // remember which devices exist, so removed ones can be put back
            restore.devices = {...devices}
            Object.values(devices).forEach(
                (value) => value.restore.set()
            )
        },
        apply: () => {
            // remove any devices added since the restore point
            for (let key of Object.keys(devices)) {
                if (!(key in restore.devices)) {
                    delete devices[key]
                }
            }
            // put back any devices removed since the restore point
            Object.assign(devices, restore.devices)
            Object.values(devices).forEach(
                (value) => value.restore.apply()
            )
        },
    }

    let btnsDisabled = $derived({
        OK: !valid,
        APPLY: !valid
    })

    onMount(async () => {
        if (!electron) {
            // do nothing if not in an electron context
            return
        }
        // wait for Python to have started so we have necessary class defs
        try {
            await profiles.devices.pending.promise
        } catch (err) {
            console.error("Can't load devices as device profiles failed to load.", err)
            return
        }
        // get devices file path
        let file = await electron.paths.devices();
        // make sure devices.json exists
        if (!(await electron.files.exists(file))) {
            await electron.files.save(file, "{}");
        }
        // get text from devices.json file
        let content = await electron.files.load(file);
        // parse JSON
        let deviceData = JSON.parse(content)
        // set data
        devicesFromJSON(deviceData)

        console.log(`Loaded devices from ${file}:`, deviceData);
    })

    async function saveDevices(evt) {
        if (!electron) {
            // do nothing if not in an electron context
            return
        }
        // get devices as JSON
        let deviceData = {};
        for (let [key, device] of Object.entries(devices)) {
            deviceData[key] = device.toJSON();
        }
        // stringify
        let content = JSON.stringify(deviceData, null, 4);
        // get devices file path
        let path = await electron.paths.devices();
        // save
        await electron.files.save(path, content);
    }

    async function openDevicesFile(evt) {
        // get file handle from system dialog
        let handle = await window.showOpenFilePicker({
            types: [{
                description: "PsychoPy Devices",
                accept: {
                    "application/json": [".json"]
                }
            }]
        });
        // get file blob from handle
        let file = await handle[0].getFile();
        // get data from JSON text
        let deviceData = JSON.parse(
            await file.text()
        )
        // set data
        devicesFromJSON(deviceData)

        console.log(`Loaded devices from ${file.name}:`, deviceData);
    }

    async function saveDevicesFile(evt) {
        // stringify devices
        let content = {};
        for (let [key, device] of Object.entries(devices)) {
            content[key] = device.toJSON();
        }
        content = JSON.stringify(content, null, 4)
        // open a file picker
        let handle = await window.showSaveFilePicker({
            types: [{
                description: "PsychoPy Devices",
                accept: {
                    "application/json": [".json"]
                }
            }],
            suggestedName: "devices.json"
        });
        // create file object
        let file = await handle.createWritable();
        // write to file
        file.seek(0);
        file.write(content);
        file.close();
    }

    function devicesFromJSON(deviceData) {
        // reset
        Object.keys(devices).forEach((key) => delete devices[key])
        currentDevice = undefined
        // add each device from the JSON as an object
        for (let [key, dev] of Object.entries(deviceData)) {
            // substitute deviceLabel for name
            if ("deviceLabel" in dev.params) {
                dev.params.name = dev.params.deviceLabel;
                delete dev.params.deviceLabel
            }
            // populate
            if (dev.tag === undefined && dev.__class__) {
                dev.tag = className(dev.__class__)
            }
            devices[key] = new Device(dev.tag, dev.profile);
            devices[key].fromJSON(dev)
            // set restore point
            devices[key].restore.set()
            // select if nothing selected yet
            if (currentDevice === undefined) {
                currentDevice = devices[key]
            }
        }
    }

    function apply(evt) {
        // set restore point
        restore.set();
        // save JSON
        saveDevices();
    }
</script>


<Dialog
    id="device-manager"
    title={translate("Device manager")}
    onopen={restore.set}
    bind:shown={shown}
>
    <ListDetail>
        {#each Object.entries(devices) as [key, device] (key)}
            <ListDetailItem
                bind:selected={
                    () => currentDevice === device,
                    (value) => {
                        if (value) {
                            currentDevice = device
                        }
                    }
                }
                data={device}
                onremove={(evt) => delete devices[key]}
                removeTooltip={translate("Remove device")}
            >
                {#snippet label()}
                    <h4>{device.name}</h4>
                    {profiles.devices.value[device.tag]?.label || device.tag}
                {/snippet}

                <DeviceDetails
                    device={device}
                ></DeviceDetails>
            </ListDetailItem>
        {/each}
        <!-- placeholder message -->
        {#if Object.keys(devices).length === 0}
            <div class=placeholder>
                <p>{translate("No devices have been setup.")}</p>
                <p>{translate("Click \"Add device\" to add a new device, or import devices from a .json file.")}</p>
            </div>
        {/if}
        {#if electron}
            <Button
                onclick={(evt) => showAddDeviceDialog = true}
                label={translate("Add device")}
                icon="/icons/btn-add.svg"
                tooltip={translate("Setup a currently connected device")}
                small
                horizontal
            />
            <AddDeviceDialog
                bind:shown={showAddDeviceDialog}
            />
        {:else}
            <Button
                onclick={openDevicesFile}
                label={translate("Import devices")}
                icon="/icons/btn-open.svg"
                tooltip={translate("Import devices from a .json file")}
                small
                horizontal
            />
        {/if}
    </ListDetail>

    {#snippet buttons()}
        <DialogButton
            role=OK
            onclick={apply}
            disabled={btnsDisabled.OK}
        />
        <DialogButton
            role=APPLY
            onclick={apply}
            disabled={btnsDisabled.APPLY}
        />
        <DialogButton
            label={translate("Export")}
            onclick={saveDevicesFile}
        />
        <DialogButton
            role=CANCEL
            onclick={restore.apply}
        />
    {/snippet}
</Dialog>

<style>
    .placeholder {
        color: var(--outline);
    }
</style>