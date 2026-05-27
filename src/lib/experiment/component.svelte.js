import { HasParams } from "./param.svelte";


export class Component extends HasParams {
    constructor(tag) {
        super(tag);
        this.routine = undefined;
        this.exp = undefined;
    }

    /**
     * Numeric index within this Component's Routine
     */
    index = $derived(
        this.routine.components.findIndex((element) => element === this)
    );

    /**
     * Start time to display on the Routine canvas
     */
    visualStart = $derived.by(() => {
        // get frame rate if possible
        let fr
        if (this.exp && !this.exp.settings?.params?.['measureFrameRate']?.val) {
            fr = parseInt(this.exp.settings.params['frameRate']?.val || 60)
        } else {
            // if measured on the fly, assume 60 for display purposes
            fr = 60;
        }
        // use estimated start if we have one
        let startEstim = parseFloat(this.params['startEstim']?.val)
        if (!isNaN(startEstim)) {
            return startEstim
        }
        // if we don't have the necessary params, return null
        if (!("startType" in this.params) || !("startVal" in this.params)) {
            return null;
        }
        // get start val and type
        let startType = this.params['startType'].val;
        let startVal = parseFloat(this.params['startVal'].val);
        // work out seconds from start type and val
        let start_secs = null;
        if (startType === "time (s)") {
            start_secs = startVal;
        } else if (startType === "frames") {
            start_secs = startVal / fr;
        }
        // sub in null for NaN
        if (isNaN(start_secs)) {
            start_secs = null;
        }

        return start_secs;
    });

    /**
     * Stop time to display on the Routine canvas
     */
    visualStop = $derived.by(() => {
        // get frame rate if possible
        let fr
        if (this.exp && !this.exp.settings?.params?.['measureFrameRate']?.val) {
            fr = parseInt(this.exp.settings.params['frameRate']?.val || 60)
        } else {
            // if measured on the fly, assume 60 for display purposes
            fr = 60;
        }
        // use estimated stop if we have one
        let durEstim = parseFloat(this.params['durationEstim']?.val)
        if (!isNaN(durEstim)) {
            return (this.visualStart || 0) + durEstim
        }
        // if we don't have the necessary params, return null
        if (!("stopType" in this.params) || !("stopVal" in this.params)) {
            return null;
        }
        // get stop type and val
        let stopType = this.params['stopType'].val;
        let stopVal = parseFloat(this.params['stopVal'].val);
        // work out seconds from stop type and val
        let stop_secs = null;
        if (stopType === "time (s)") {
            stop_secs = stopVal;
        } else if (stopType === "duration (s)") {
            stop_secs = this.visualStart + stopVal;
        } else if (stopType === "frames") {
            stop_secs = stopVal / fr;
        }
        // sub in null for NaN
        if (isNaN(stop_secs)) {
            stop_secs = null;
        }

        return stop_secs;
    });

    /**
     * Color of this Component on the Routine canvas
     */
    visualColor = $derived.by(() => {
        if (this.tag === "StaticComponent") {
            return "red";
        } else if (this.disabled) {
            return "overlay";
        } else if (this.forceEnd) {
            return "orange";
        } else {
            return "blue";
        }
    });

    /**
     * Can this Component end the Routine?
     */
    forceEnd = $derived.by(() => {
        let force_end = false;

        for (let attr of ["forceEndRoutine", "endRoutineOn", "forceEndRoutineOnPress"]) {
            if (attr in this.params) {
                if ([
                    true, "true", "True", // alias of true
                    "any click", "correct click", "valid click", // mouse
                    "look at", "look away", // roi
                ].includes(this.params[attr].val)) {
                    force_end = true;
                }
            }
        }

        return force_end;
    });
}
