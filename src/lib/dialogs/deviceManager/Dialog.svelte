<script>
    import { Dialog } from "$lib/utils/dialog";
    import DeviceDetails from "./DeviceDetails.svelte";
    import { ButtonTab, Listbook, NotebookPage } from "$lib/utils/notebook";
    import { Device } from "$lib/experiment";
    import { devices, electron } from "$lib/globals.svelte";
    import AddDeviceDialog from "./addDevice/AddDeviceDialog.svelte";
    import { pending } from "$lib/experiment/profiles.svelte";
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
        set: () => Object.values(devices).forEach(
            (value) => value.restore.set()
        ),
        apply: () => Object.values(devices).forEach(
            (value) => value.restore.apply()
        ),
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
        await pending.devices.promise
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
</script>


<Dialog
    id="device-manager"
    title={translate("Device manager")}
    buttons={{
        OK: evt => {
            // set restore point
            restore.set();
            // save JSON
            saveDevices();
        },
        APPLY: evt => {
            // set restore point
            restore.set();
            // save JSON
            saveDevices();
        },
        EXTRA: {
            Export: saveDevicesFile
        },
        CANCEL: restore.apply,
        HELP: ""
    }}
    buttonsDisabled={btnsDisabled}
    onopen={restore.set}
    bind:shown={shown}
>
    <div class=container>
        <Listbook>
            {#each Object.entries(devices) as [key, device]}
                <NotebookPage
                    bind:selected={
                        () => {return currentDevice === device},
                        (value) => {currentDevice = device}
                    }
                    label={device.name} 
                    data={device}
                    close={(evt) => delete devices[key]}
                >
                    <DeviceDetails
                        device={device}
                    ></DeviceDetails>
                </NotebookPage>
            {/each}
            <!-- placeholder page -->
            {#if Object.keys(devices).length === 0}
            <NotebookPage
                label=""
                selected
            >
                <div class=placeholder-page>
                    <p>{translate("No devices have been setup.")}</p>
                    <p>{translate("Click \"Add device\" to add a new device, or import devices from a .json file.")}</p>
                </div>
            </NotebookPage>
            {/if}

            {#if electron}
                <ButtonTab
                    callback={(evt) => showAddDeviceDialog = true}
                    label={translate("+ Add device")}
                    tooltip={electron
                        ? translate("Setup a currently connected device")
                        : translate("Device setup not available in web-only")
                    }
                    disabled={!electron}
                />
                <AddDeviceDialog
                    bind:shown={showAddDeviceDialog}
                />
            {/if}
            <ButtonTab
                callback={openDevicesFile}
                label={translate("⭱ Import devices")}
                tooltip={translate("Import devices from a .json file")}
            />
        </Listbook>
    </div>
</Dialog>

<style>
    .container {
        padding: 1rem;
        height: 100%;
        box-sizing: border-box;
    }
    .placeholder-page {
        padding: 0 1rem;
        width: 30rem;
        color: var(--outline)
    }
</style>