<script>
    import { ParamCtrl } from "$lib/paramCtrls"
    import { Dialog } from "$lib/utils/dialog";
    import { CalibrationSetup } from "./configuration.svelte";
    import { python } from "$lib/globals.svelte";
    import { translate } from "$lib/translation";

    let {
        param=$bindable(),
        shown=$bindable()
    } = $props()

    async function calibrate() {
        // setup a window
        await python.liaison.send("app", {
            command: "init",
            args: [
                "calibrationWin",
                "psychopy.visual.window:Window"
            ],
            kwargs: {
                screen: parseInt(config.params['screen'].val), 
                checkTiming: false,
                fullscr: true
            }
        }, 10000)
        // setup a photometer
        let photometerName
        await python.liaison.send("app", {
            // get available photometers for chosen class
            command: "run",
            args: [
                "psychopy.hardware.manager:DeviceManager.getAvailableDevices",
                $state.snapshot(config.params.photometer.val)
            ]
        }).then(
            profiles => {
                // store device name
                photometerName = profiles[0].deviceName;
                // create device
                return python.liaison.send("app", {
                    command: "run",
                    args: ["psychopy.hardware:DeviceManager.addDevice"],
                    kwargs: profiles[0]
                })
            }
        )
        // run calibration
        let resp = await python.liaison.send("app", {
            command: "run",
            args: [
                "psychopy.hardware.monitor:calibrateGamma",
                "$calibrationWin",
                photometerName
            ],
            kwargs: {
                patchSize: parseFloat(config.params.patchSize.val),
                nPoints: parseInt(config.params.nPoints.val)
            }
        })
    }

    let config = $state.raw()
    function reset() {
        config = new CalibrationSetup()
    }
    reset()
</script>

<Dialog
    title={translate("Monitor calibration setup")}
    buttons={{
        OK: calibrate,
        CANCEL: reset
    }}
    bind:shown={shown}
    shrink
>
    <div class=calibration-config>
        {#await config.ready}
            {translate("Getting photometer classes...")}
        {:then}
            {#each Object.keys(config.params) as key}
                <ParamCtrl 
                    name={key}
                    bind:param={config.params[key]}
                />
            {/each}
        {/await}
    </div>
</Dialog>

<style>
    .calibration-config {
        display: flex;
        flex-direction: column;
        gap: .5rem;
        justify-content: stretch;
        align-items: stretch;
        padding: 1rem;
        min-width: 35rem;
    }
</style>