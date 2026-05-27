import FallbackComponentProfiles from "$lib/experiment/fallbacks/components.json";
import FallbackLoopProfiles from "$lib/experiment/fallbacks/loops.json";
import FallbackDeviceProfiles from "$lib/experiment/fallbacks/devices.json";
import FallbackPreferencesProfile from "$lib/preferences.json";
import { python } from "$lib/globals.svelte";
import { getLocale } from "$lib/translation";


export var profiles = $state({
    components: FallbackComponentProfiles,
    loops: FallbackLoopProfiles,
    devices: FallbackDeviceProfiles,
    preferences: FallbackPreferencesProfile
})

export var pending = $state({
    components: Promise.withResolvers(),
    loops: Promise.withResolvers(),
    devices: Promise.withResolvers(),
    preferences: Promise.withResolvers()
})

// populate on Liaison starting (if it ever does)
if ( python ) {
    python.liaison.ready("app").then(
        // set language before getting profiles
        () => python.liaison.send("app", {
            command: "try",
            args: [
                "psychopy.localization:setLocale",
                getLocale()
            ]
        })
    ).then(
        () => {
            // get components
            pending.components.resolve(
                python.liaison.send("app", {
                    command: "run",
                    args: [
                        "psychopy.experiment:getElementProfiles"
                    ]
                }).then(
                    data => Object.assign(profiles.components, data)
                )
            ) 
            // get loops
            pending.loops.resolve(
                python.liaison.send("app", {
                    command: "run",
                    args: [
                        "psychopy.experiment:getLoopProfiles"
                    ]
                }).then(
                    data => Object.assign(profiles.loops, data)
                )
            )
            // get devices
            pending.devices.resolve(
                python.liaison.send("app", {
                    command: "run",
                    args: [
                        "psychopy.experiment:getDeviceProfiles"
                    ]
                }).then(
                    resp => Object.assign(profiles.devices, resp)
                )
            )
            // todo: get prefs
        }
    )
}
