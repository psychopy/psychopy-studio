<script>
    import { Dialog } from "$lib/utils/dialog";
    import { Notebook, NotebookPage } from "$lib/utils/notebook";
    import NamedColor from "./NamedColor.svelte";
    import HexColor from "./HexColor.svelte";
    import RgbColor from "./RgbColor.svelte";
    import DklColor from "./DklColor.svelte";
    import HsvColor from "./HsvColor.svelte";
    import LmsColor from "./LmsColor.svelte";
    import { translate } from "$lib/translation";

    let {
        value=$bindable(),
        space=$bindable(),
        /** Color space options to show */
        allowedSpaces=["named", "hex", "rgb", "dkl", "lms", "hsv"],
        /** Is output going to code or to a param? */
        target="param",
        /** @bindable State controlling whether each button is disabled */
        buttonsDisabled={},
        /** @bindable @type {Boolean} State dictating whether this dialog is shown */
        shown=$bindable(),
    } = $props();

    // restore value for this dialog's value (set on open/apply/ok)
    let restore = {
        color: $state.snapshot(value),
        space: $state.snapshot(space)
    };
</script>

<Dialog
    id=color-picker
    title={translate("Color Picker")}
    onopen={evt => restore = {
        color: $state.snapshot(value),
        space: $state.snapshot(space)
    }}
    buttons={{
        OK: evt => restore = {
            color: $state.snapshot(value),
            space: $state.snapshot(space)
        },
        APPLY: evt => restore = {
            color: $state.snapshot(value),
            space: $state.snapshot(space)
        },
        CANCEL: evt => {
            value = restore.color;
            space = restore.space;
        }
    }}
    buttonsDisabled={buttonsDisabled}
    bind:shown={shown}
>
    <div class=page>
        <input bind:value={value} />
        <Notebook>
            {#each [
                ["named", NamedColor],
                ["hex", HexColor],
                ["rgb", RgbColor],
                ["dkl", DklColor],
                ["hsv", HsvColor],
                ["lms", LmsColor]
            ] as [thisSpace, Component]}
                {#if allowedSpaces.includes(thisSpace)}
                    <NotebookPage
                        label={thisSpace}
                        bind:selected={
                            () => space === thisSpace,
                            (value) => space = thisSpace
                        }
                    >
                        <div class=page>
                            <Component 
                                bind:value={value} 
                                target={target}
                            />
                        </div>
                    </NotebookPage>
                {/if}
            {/each}
        </Notebook>
    </div>
</Dialog>

<style>
    .page {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding: 1rem;
        min-width: 35rem;
    }
</style>