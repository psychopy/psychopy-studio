import FallbackPreferencesProfile from "$lib/preferences.json";
import { python, electron } from "$lib/globals.svelte";
import { getLocale } from "$lib/translation";


function trackPromise() {
    // create promise with functions
    let pending = Promise.withResolvers()
    // start off unresolved and unrejected
    pending.resolved = false
    pending.rejected = false
    // get original resolve and reject functions
    let { resolve, reject } = pending
    // on resolution, mark resolved
    pending.resolve = function (value) {
        resolve(value)
        this.resolved = true
    }
    // on rejection, mark rejected
    pending.reject = function (value) {
        reject(value)
        this.rejected = !this.resolved
    }

    return pending
}


/**
 * Each set of profiles has:
 * - value: the profiles themselves
 * - pending: resolvers for a promise which resolves once profiles are available (with `fallback`
 *   set to the error if Python failed and last saved profiles were used instead)
 * - isFallback: Whether or not the resolved values are a fallback (e.g. from last load)
 * - getter: import string for the Python function which gets the profiles
 */
export var profiles = $state({
    components: {
        value: {},
        pending: trackPromise(),
        isFallback: undefined,
        getter: async (timeout) => await python.liaison.send("app", {
            command: "run",
            args: ["psychopy.experiment:getElementProfiles"]
        }, timeout)
    },
    loops: {
        value: {},
        pending: trackPromise(),
        isFallback: undefined,
        getter: async (timeout) => await python.liaison.send("app", {
            command: "run",
            args: ["psychopy.experiment:getLoopProfiles"]
        }, timeout)
    },
    devices: {
        value: {},
        pending: trackPromise(),
        isFallback: undefined,
        getter: async (timeout) => await python.liaison.send("app", {
            command: "run",
            args: ["psychopy.experiment:getDeviceProfiles"]
        }, timeout)
    },
    preferences: {
        value: FallbackPreferencesProfile,
        pending: trackPromise(),
        isFallback: undefined,
        getter: async (timeout) => FallbackPreferencesProfile
    }
})

/**
 * Get a set of profiles from Python, store them as the last received values and resolve their
 * promise.
 *
 * @param {string} key Which set of profiles to get (e.g. "components", "loops", "devices")
 * @param {number} timeout How long to wait for Python to respond (ms)
 * @param {boolean} force If true, replace the pending promise even if it's already resolved (so
 * anything awaiting it shows as loading again)
 * @returns {Promise<object>} Promise which resolves to the received profiles (or the last saved
 * profiles, if Python fails to get them), or rejects (also rejecting the pending promise) if
 * Python fails to get them and there are no saved profiles to fall back on
 */
export async function refresh(key, timeout=undefined, force=false) {
    // refresh a previously rejected or fallen back promise (or any promise, if forced)
    if (force || profiles[key].pending.rejected || profiles[key].isFallback) {
        profiles[key].pending = trackPromise()
    }
    // get the relevant promise now, in case it's overwritten mid-function
    let pending = profiles[key].pending
    // get profiles from supplied getters
    let data
    try {
        data = await profiles[key].getter(timeout)
    } catch (err) {
        // get last saved profiles
        let saved = electron?.state.getProfiles()?.[key]
        // if there are none, mark as rejected
        if (!saved) {
            pending.reject(err)
            throw err
        }
        // otherwise, fall back on last saved profiles
        console.error(`Failed to get ${key} profiles from Python, using last saved profiles.`, err)
        profiles[key].value = saved
        pending.resolve(profiles[key].value)
        profiles[key].isFallback = true

        return profiles[key].value
    }
    // store as last received, to use next time before Python is ready
    electron?.state.setProfiles(key, data)
    // replace profiles
    profiles[key].value = data
    pending.resolve(profiles[key].value)
    profiles[key].isFallback = false

    return profiles[key].value
}

// use last received profiles until we receive new ones
for (let [key, value] of Object.entries(electron?.state.getProfiles() || {})) {
    if (profiles[key]?.getter && value) {
        profiles[key].value = value
        profiles[key].pending.resolve(profiles[key].value)
        profiles[key].isFallback = true
    }
}

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
        () => Promise.all(
            Object.keys(profiles).filter(
                key => profiles[key].getter
            ).map(
                key => refresh(key)
            )
        )
    ).catch(
        err => console.error("Failed to get profiles from Python.", err)
    )
}
