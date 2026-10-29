<script>
    import { Dialog } from "$lib/ui/dialog";
    import { translate } from "$lib/translation";
    import { Field } from "$lib/ui/input";

    let {
        /** @prop @type {object} Search filters (as used by SearchProjects) to edit */
        filters=$bindable(),
        /** @prop @type {boolean} Is this dialog shown? */
        shown=$bindable()
    } = $props()
    // working copy of params, so changes only apply on OK
    let draft = $state()
</script>

<Dialog
    id=search-projects-filter
    title={translate("Filter projects")}
    bind:shown={shown}
    onopen={() => draft = $state.snapshot(filters)}
    buttons={{
        OK: evt => filters = draft,
        CANCEL: evt => {},
        EXTRA: {
            Clear: evt => draft = {}
        }
    }}
    shrink
>
    {#if draft}
        <div class=container>
            <Field
                label={translate("Author")}
                tooltip={translate("Only include projects by a specific user or group")}
            >
                <input bind:value={draft.designer} />
            </Field>
        </div>
    {/if}
</Dialog>

<style>
    .container {
        display: flex;
        flex-direction: column;
        gap: .5rem;
        align-items: left;
        padding: 1rem;
    }
</style>
