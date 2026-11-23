<script>
    import { getContext, onDestroy } from "svelte";
    import DeviceProfile from "../DeviceProfile.svelte";
    import { fade } from "svelte/transition";
    import { RadioButton } from "$lib/ui/button";
    import { Info } from "$lib/ui/tooltip";

    let {
        selection=$bindable(),
        device,
        backend
    } = $props()


    onDestroy(() => {
        // clear selected device if selected and destroyed
        if (selection === device) {
            selection = undefined;
        }
    })
</script>

<div
    class=device-list-item
>
    <RadioButton
        bind:selection={selection}
        label={device.deviceName}
        value={{
            device: device,
            backend: backend
        }}
    />
    <Info>
        <div 
            class=details-panel
            transition:fade
        >
            <DeviceProfile
                profile={device}
            />
        </div>
    </Info>
    
</div>

<style>
    .device-list-item {
        position: relative;
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: .5rem;
    }
    
    .details-panel {
        /* fit within the Info popover's 35rem max-width, minus its padding */
        width: 34rem;
        background-color: transparent;
        color: var(--text);
    }
</style>