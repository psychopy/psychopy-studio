<script>
    import { Listbook, Notebook, NotebookPage, ButtonTab } from "$lib/utils/notebook";
    import { getContext } from "svelte";
    import { python } from "$lib/globals.svelte";
    import MonitorConfigurationPanel from "./MonitorConfiguration.svelte";
    import { translate } from "$lib/translation";
    import { makeUnique } from "$lib/utils/tools/namespace.js";
    import { MonitorConfiguration } from "./configuration.svelte";

    let {
        details=$bindable()
    } = $props()

    let monitors = getContext("monitors");

    // on rename calibration, reassign key
    $effect(() => {
        for (let [key, calib] of Object.entries(details.calibrations)) {
            if (!(calib.name in details.calibrations)) {
                details.calibrations[calib.name] = calib
                delete details.calibrations[key]
            }
        }
    })
</script>

<Listbook>
    {#each Object.entries(details.calibrations || {}) as [calibName, calib]}
        <NotebookPage
            label={calibName}
            bind:selected={
                () => monitors.selection?.calibration === calibName,
                (evt) => monitors.selection.calibration = calibName
            }
        >
            {#if details.calibrations[calibName]}
                <MonitorConfigurationPanel 
                    bind:calib={details.calibrations[calibName]}
                />
            {/if}
        </NotebookPage>
    {/each}
    <ButtonTab
        callback={async evt => {
            // create unique name
            let name = makeUnique("calibration", Object.keys(details.calibrations))
            // create calib object
            details.calibrations[name] = new MonitorConfiguration(details.name, name)
            details.calibrations[name].fromJSON({
                "calibDate": new Date().getUTCDate(),
                "distance": 55,
                "sizePix": [],
                "width": 50,
                "usebits": false,
                "gammaGrid": "[[0. 1. 1.]\n [0. 1. 1.]\n [0. 1. 1.]\n [0. 1. 1.]]"
            })
        }}
        label="+ New calibration"
        tooltip={translate("Add a new monitor configuration")}
    />
</Listbook>