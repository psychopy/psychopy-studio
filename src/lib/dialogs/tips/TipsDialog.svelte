<script>
    import { MessageDialog, DialogButton } from "$lib/ui/dialog";
    import { electron } from "$lib/globals.svelte";
    import tips from "./tips.svelte.js";
    import { Icon } from "$lib/ui/icon";
    import { prefs } from "$lib/preferences.svelte";
    import { marked } from "marked";
    import { translate } from "$lib/translation";

    let {
        categories=["general", "silly"],
        shown=$bindable()
    } = $props()

    let hide = $state.raw()

    // listen for show message from electron
    if (electron) {
        electron.windows.listen("showTips", (evt, value) => shown = value)
    }
    // pick a tip at random
    let tip = $state.raw();
    function chooseTip() {
        // get options from categories
        let options = tips.filter(
            tip => categories.some(
                categ => tip.categories.includes(categ)
            )
        )
        // pick one at random
        tip = options[
            Math.floor(Math.random() * options.length)
        ]
    }
    chooseTip()
</script>

<MessageDialog
    title={translate("PsychoPy Tips")}
    bind:shown={shown}
>
    <div class=tip>
        <span style:color=var(--blue)>
            <Icon 
                src={tip.icon || "/icons/sym-info.svg"}
                size=3rem
            />
        </span>
        {@html marked(tip.message)}
    </div>
    <div class=stop>
        <input type=checkbox bind:checked={hide}/>
        {translate("Don't show startup tips")}
    </div>
    {#snippet buttons()}
        <DialogButton
            action=OK
            onclick={evt => {
                if (hide) {
                    prefs.params.showStartupTips.val = false;
                    prefs.save()
                }
            }}
        />
        <DialogButton
            label={translate("Refresh")}
            onclick={chooseTip}
        />
    {/snippet}
</MessageDialog>

<style>
    .tip {
        display: grid;
        padding: 1rem 2rem;
        gap: 2rem;
        grid-template-columns: 3rem 35rem;
        background-color: var(--base);
        border: 1px solid var(--overlay);
        border-radius: .5rem;
        align-items: center;
    }
    .stop {
        display: flex;
        flex-direction: row;
        margin: 1rem;
        margin-bottom: 0;
        justify-content: flex-end;
        gap: .5rem;
    }
</style>