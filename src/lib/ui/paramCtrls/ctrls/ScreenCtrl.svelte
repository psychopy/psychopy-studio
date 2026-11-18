<script>
    import { validateScreen } from "./validators.svelte.js";
    import SingleLineCtrl from "./SingleLineCtrl.svelte";
    import { Button } from "$lib/ui/button";
    import { python } from "$lib/globals.svelte";
    import { translate } from "$lib/translation";

    let {
        /** @prop @type {import("$lib/experiment").Param} Param object to which this ctrl pertains */
        param=$bindable(),
        /** @prop @type {boolean} Controls whether this control is disabled */
        disabled=false,
        /** @interface */
        ...attachments
    } = $props()

    // get the number of screens on mount
    let numScreens = $state.raw()
    python.liaison.send("app", {
        command: "run",
        args: [
            "psychopy.hardware:DeviceManager.getScreenCount"
        ]
    }).then(
        resp => numScreens = resp
    )

</script>

<SingleLineCtrl
    bind:param={param}
    disabled={disabled}
    {@attach element => param.registerValidator("screen", (param, valid) => validateScreen(param, valid, numScreens), 5)}
    {...attachments}
/>

<Button
    icon="/icons/btn-monitors.svg"
    tooltip={translate("Show screen numbers")}
    onclick={evt => python.liaison.send("app", {
        command: "run",
        args: [
            "psychopy.hardware:DeviceManager.showScreenNumbers"
        ]
    })}
    small
/>
