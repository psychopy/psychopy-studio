<script>
    import { validateTable } from "./validators.svelte.js";
    import { getContext } from "svelte";
    import { Button } from "$lib/ui/button";
    import FileCtrl from "./FileCtrl.svelte";
    import { electron, python } from "$lib/globals.svelte";
    import { MessageDialog } from "$lib/ui/dialog"; 
    import { translate } from "$lib/translation";

    let {
        /** @prop @type {import("$lib/experiment").Param} Param object to which this ctrl pertains */
        param=$bindable(),
        /** @prop @type {boolean} Controls whether this control is disabled */
        disabled=false,
        /** @interface */
        ...attachments
    } = $props()

    let current = getContext("current")

    let showPrompt = $state.raw(false)

    function openTable() {
        electron.files.openPath(current.experiment.relativePath(param.val))
    }

    function newTable() {
        showPrompt = true
        if (param?.ctrlParams?.template) {
            // if a table is given, open it
            electron.files.openPath(param.ctrlParams.template).then(
                resp => console.log(resp, param.ctrlParams.template)
            )
        } else {
            // otherwise, get the default from Python...
            python.liaison.send("app", {
                command: "run",
                args: [
                    "psychopy.experiment.utils:getBlankTemplate"
                ]
            }, 1000).then(
                // ...and open it
                resp => electron.files.openPath(resp)
            )
        }
    }

</script>


<FileCtrl
    param={param}
    disabled={disabled}
    {@attach element => param.registerValidator("table", validateTable, -5)}
    {...attachments}
></FileCtrl>
{#if electron}
    <Button
        icon="/icons/btn-{param.val ? "" : "new-"}table.svg"
        tooltip={param.val ? translate("Open table") : translate("Create table")}
        onclick={param.val ? openTable : newTable}
        disabled={disabled || param.isCode}
        small
    />

    <MessageDialog
        title={translate("Reminder...")}
        bind:shown={showPrompt}
        buttons={["OK"]}
    >
        <p>{translate("Once you have created and saved your table, please remember to add it.")}</p>
    </MessageDialog>
{/if}