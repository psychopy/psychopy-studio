import { Param } from "$lib/experiment";
import { python } from "$lib/globals.svelte";
import { translate } from "$lib/translation";


export class MonitorConfiguration {
    params = $state({})

    constructor(monitor, name, date) {
        this.monitor = monitor
        this.name = name
        this.date = date
    }

    /**
     * @returns JSON object representing this element
     */
    toJSON() {
        return {
            calibDate: this.date,
            distance: $state.snapshot(this.params.distance.val),
            sizePix: String.prototype.split($state.snapshot(this.params.sizePix.val), ",").map(val => String.prototype.trim(val)),
            width: $state.snapshot(this.params.width.val),
            usebits: $state.snapshot(this.params.usebits.val),
            gammaGrid: $state.snapshot(this.params.gammaGrid.val),
        }
    }

    /**
     * Populate this element from a JSON object
     *
     * @param {Object} node JSON object representing this element
     */
    fromJSON(node) {
        // store date
        this.date = node.calibDate
        // setup param attributes for each param
        this.params.distance = new Param("distance")
        Object.assign(this.params.distance, {
            val: node.distance,
            updates: "constant",
            inputType: "single",
            valType: "code",
            label: translate("Screen distance (cm)"),
            hint: translate("How far, in centimeters (cm), is the screen from the participant?")
        })
        this.params.sizePix = new Param("sizePix")
        Object.assign(this.params.sizePix, {
            val: node.sizePix,
            updates: "constant",
            inputType: "single",
            valType: "list",
            label: translate("Screen size (pix)"),
            hint: translate("The dimensions of the screen in pixels")
        })
        this.params.width = new Param("width")
        Object.assign(this.params.width, {
            val: node.width,
            updates: "constant",
            inputType: "single",
            valType: "code",
            label: translate("Screen width (cm)"),
            hint: translate("The width of the screen in centimeters (cm)")
        })
        this.params.usebits = new Param("usebits")
        Object.assign(this.params.usebits, {
            val: node.usebits,
            updates: "constant",
            inputType: "bool",
            valType: "code",
            label: translate("Use bits++?"),
            hint: translate("Whether to use a CRS Bits++ calibration tool")
        })
        this.params.gammaGrid = new Param("gammaGrid")
        Object.assign(this.params.gammaGrid, {
            val: node.gammaGrid,
            updates: "constant",
            inputType: "calibration",
            valType: "code",
            label: translate("Gamma calibration"),
            hint: translate("Gamma calibration grid")
        })
        
        // {
        //     "calibDate": 1722588709,
        //     "gamma": 1,
        //     "width": 30,
        //     "distance": 57,
        //     "notes": "default (not very useful) monitor",
        //     "psychopyVersion": "2024.3.0",
        //     "usebits": false,
        //     "gammaGrid": "[[0. 1. 1.]\n [0. 1. 1.]\n [0. 1. 1.]\n [0. 1. 1.]]",
        //     "linearizeMethod": 1,
        //     "sizePix": [
        //         1024,
        //         768
        //     ]
        // }
    }
}


export class CalibrationSetup {
    params = $state({})

    constructor() {
        this.params.photometer = new Param("photometer")
        Object.assign(this.params.photometer, {
            valType: "code",
            inputType: "choice",
            label: translate("Photometer"),
            hint: translate("Photometer device, from the device manager, to use for this calibration")
        })
        this.params.screen = new Param("screen")
        Object.assign(this.params.screen, {
            valType: "code",
            inputType: "single",
            label: translate("Screen"),
            hint: translate("Screen number to run calibration on")
        })
        this.params.patchSize = new Param("patchSize")
        Object.assign(this.params.patchSize, {
            val: 0.3,
            valType: "code",
            inputType: "single",
            label: translate("Patch size"),
            hint: translate("How much of the screen (0-1) the calibration patch should occupy")
        })
        this.params.nPoints = new Param("nPoints")
        Object.assign(this.params.nPoints, {
            val: 8,
            valType: "code",
            inputType: "single",
            label: translate("Calibration points"),
            hint: translate("How many calibration points to use")
        })
        // get photometer classes
        this.ready = python.liaison.send("app", {
            command: "run",
            args: [
                "psychopy.experiment.monitor:BasePhotometerDeviceBackend.__subclasses__"
            ]
        }).then(
            async resp => {
                // temp array of allowed vals and allowed labels
                let temp = {
                    allowedVals: [],
                    allowedLabels: []
                }
                // add values for each cls
                for (let cls of resp) {
                    // add device cls to allowedVals
                    await python.liaison.send("app", {
                        command: "get",
                        args: [
                            cls.match(/python\:\/\/\/(.*)/)[1] + ".deviceClass"
                        ]
                    }, 5000).then(
                        resp => temp.allowedVals.push(resp)
                    )
                    // add device lbl to allowedLabels
                    await python.liaison.send("app", {
                        command: "get",
                        args: [
                            cls.match(/python\:\/\/\/(.*)/)[1] + ".backendLabel"
                        ]
                    }, 5000).then(
                        resp => temp.allowedLabels.push(resp)
                    )
                }
                // apply temp array
                Object.assign(this.params.photometer, temp)
                this.params.photometer.val = temp.allowedVals[0]
            }
        )
    }
}