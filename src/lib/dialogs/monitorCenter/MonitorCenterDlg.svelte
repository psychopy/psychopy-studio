<script>
    import { Dialog } from "$lib/utils/dialog";
    import { Listbook, Notebook, NotebookPage, ButtonTab } from "$lib/utils/notebook";
    import { python } from "$lib/globals.svelte";
    import { MonitorConfiguration } from "./configuration.svelte";
    import { translate } from "$lib/translation";
    import { makeUnique } from "$lib/utils/tools/namespace.js";
    import MonitorPage from "./MonitorPage.svelte";
    import { setContext } from "svelte";

    let {
        shown=$bindable()
    } = $props()

    let monitors = $state({
        all: {},
        selection: {
            monitor: undefined,
            calibration: undefined
        },
        promise: Promise.resolve([]),
        save: () => {
            // iterate through monitors
            for (let [name, monitor] of Object.entries(monitors.all)) {
                python.liaison.send("app", {
                    // create monitor
                    command: "init",
                    args: [
                        `monitor_${name}`,
                        "psychopy.monitors.calibTools:Monitor",
                        name
                    ]
                }, 100000)
                .then(
                    resp => python.liaison.send("app", {
                        // apply json
                        command: "run",
                        args: [
                            `monitor_${name}.fromJSON`,
                            {
                                name: monitor.name,
                                calibrations: Object.fromEntries(Object.entries(monitor.calibrations).map(
                                    ([name, calib]) => [name, calib.toJSON()]
                                ))
                            }
                        ]
                    }, 100000)
                )
                .then(
                    resp => python.liaison.send("app", {
                        // save monitor
                        command: "run",
                        args: [
                            `monitor_${name}.save`
                        ]
                    }, 100000)
                )
            }
        },
        refresh: () => {
            // clear monitors
            monitors.all = {}
            // request names
            monitors.promise = python.liaison.send("app", {
                command: "run",
                args: [
                    "psychopy.monitors.calibTools:getAllMonitors"
                ]
            }, 100000).then(
                monitorNames => {
                    // iterate through names
                    for (let name of monitorNames) {
                        // get monitor details for each
                        python.liaison.send("app", {
                            command: "run",
                            args: [
                                "psychopy.monitors.calibTools:Monitor",
                                name
                            ]
                        }, 100000).then(
                            details => {
                                // convert config details to params
                                for (let [calibName, calib] of Object.entries(details.calibrations || {})) {
                                    details.calibrations[calibName] = new MonitorConfiguration(name, calibName, calib.calibDate);
                                    details.calibrations[calibName].fromJSON(calib)
                                }
                                // store in array once ready
                                monitors.all[name] = details
                            }
                        )
                    }
                }
            )
        },
        new: () => {
            // make a unique name
            let name = makeUnique("monitor", Object.keys(monitors.all))
            // add it to monitors array
            monitors.all[name] = {
                name: name,
                calibrations: []
            }
        }
    });
    setContext("monitors", monitors)
    // on rename monitor, reassign key
    $effect(() => {
        for (let [key, monitor] of Object.entries(monitors.all)) {
            if (!(monitor.name in monitors.all)) {
                monitors.all[monitor.name] = monitor
                delete monitors.all[key]
            }
        }
    })
    // refresh on init to populate
    monitors.refresh()
</script>

<Dialog
    title={translate("Monitor Center")}
    buttons={{
        OK: monitors.save,
        APPLY: monitors.save,
        CANCEL: monitors.refresh
    }}
    bind:shown={shown}
>
    <div class=content>
        <Notebook>
            {#await monitors.promise}
                {translate("Loading monitors...")}
            {:then}
                {#each Object.entries(monitors.all) as [name, details]}
                    <NotebookPage
                        bind:label={monitors.all[name].name}
                        close={evt => delete monitors.all[name]}
                        bind:selected={
                            () => monitors.selection.monitor === name,
                            (evt) => monitors.selection.monitor = name
                        }
                    >
                        <MonitorPage 
                            bind:details={monitors.all[name]}
                        />
                    </NotebookPage>
                {/each}
            {:catch err}
                {err}
            {/await}
            <ButtonTab
                callback={monitors.new}
                label="+"
                tooltip={translate("Add a new monitor configuration")}
            />
        </Notebook>
    </div>
</Dialog>

<style>
    .content {
        padding: 1rem;
        min-width: 35rem;
        height: 100%;
        box-sizing: border-box;
    }
</style>