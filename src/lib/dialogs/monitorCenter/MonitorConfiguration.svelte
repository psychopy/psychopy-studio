<script>
    import { Button } from "$lib/utils/buttons";
    import { ParamCtrl } from "$lib/paramCtrls";
    import CalibrationSetupDlg from "./CalibrationSetupDlg.svelte";
    import { translate } from "$lib/translation";

    let {
        calib=$bindable()
    } = $props()

    let show = $state({
        calibSetup: false
    })
</script>


<div class=monitor-config>
    {#each Object.keys(calib.params) as key}
        <ParamCtrl 
            name={key}
            bind:param={calib.params[key]}
        />
    {/each}
    <div class=calibrate-btn>
        <Button 
            label={translate("Calibrate")}
            icon="/icons/btn-runpy.svg"
            onclick={evt => show.calibSetup = true}
            horizontal
        />
        <CalibrationSetupDlg 
            bind:param={calib.params.gammaGrid}
            bind:shown={show.calibSetup}
        />
    </div>
</div>

<style>
    .monitor-config {
        display: flex;
        flex-direction: column;
        gap: .5rem;
        justify-content: stretch;
        align-items: stretch;
        padding: 1rem;
        min-width: 35rem;
    }
    .calibrate-btn {
        align-self: end;
    }
</style>