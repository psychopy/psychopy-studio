<script>
    import ComponentButton from './ComponentButton.svelte';
    import ComponentSection from './Section.svelte';

    import { profiles as allProfiles, pending as profilesPending } from '$lib/experiment/profiles.svelte';
    import RoutineButton from './RoutineButton.svelte';
    import FilterDialog from './FilterDialog.svelte';
    import { CompactButton } from "$lib/utils/buttons";
    import { PluginManagerDlg } from "$lib/dialogs/pluginManager"
    import { electron, python } from "$lib/globals.svelte";
    import { translate } from "$lib/translation";

    /**
     * Sort Components into ordered categories
     * 
     * @param profiles { object } Object containing Component profiles, unsorted
     * 
     * @returns { array<array> } Entries-style array, with each item being a category (in order) and matching profiles
     */
    function sortProfiles(profiles) {
        // get all unique categs from profiles
        let categs = Object.values(profiles).reduce(
            (all, profile) => Array.prototype.concat(all, profile.categories.filter(categ => !all.includes(categ))),
            [],
        )
        // define which categories go first and last
        let categOrder = {
            first: ["Stimuli", "Responses"],
            last: ["I/O", "Custom", "Other"]
        }
        // sort categories
        categs.sort(
            (a, b) => (
                // prioritise categs listed in `first`
                categOrder.first.includes(b) - categOrder.first.includes(a)
            ) + (
                // deprioritise categs listed in `last`
                categOrder.last.includes(a) - categOrder.last.includes(b)
            )
        )
        // sort profiles into categories
        let sorted = categs.map(
            categ => [
                categ, 
                Object.values(profiles).filter(
                    profile => (
                        // only include profiles in this category
                        profile.categories.includes(categ) && 
                        // skip base elements
                        !profile['__class__'].match(/psychopy\.experiment\.(components|routines)\._?base:.*/) &&
                        // skip hidden elements
                        !profile.hidden
                    )
                )
            ]
        )

        return sorted
    }

    /**
     * Apply the current filter to an array of profiles
     */
    function filterProfiles(profiles) {
        return profiles.filter(
            profile => filter === undefined || filter.every(
                value => profile.targets.includes(value)
            )
        )
    }

    /**
     * Get Components again from PsychoPy
     */
    async function refreshProfiles() {
        if (await python?.ready) {
            profilesPending.components.resolve(
                python.liaison.send("app", {
                    command: "run",
                    args: ["psychopy.experiment:getElementProfiles"]
                }, 100000).then(
                    data => Object.assign(allProfiles.components, data)
                )
            )
        }
    }

    let showFilterDlg = $state.raw(false);
    let showPluginMgr = $state.raw(false);
    let filter = $state()
</script>
<div id="components">
    <div class=ctrls>
        {#if python?.ready}
            <CompactButton
                icon="/icons/btn-add.svg"
                tooltip={translate("Get more...")}
                onclick={evt => showPluginMgr = true}
            />
            <PluginManagerDlg 
                bind:shown={showPluginMgr}
            />
            <CompactButton
                icon="/icons/btn-refresh.svg"
                tooltip={translate("Reload Components")}
                onclick={refreshProfiles}
            />
        {/if}
        <CompactButton
            icon="/icons/btn-filter.svg"
            tooltip={translate("Filter...")}
            onclick={evt => showFilterDlg = true}
        />
        <FilterDialog
            bind:filter={filter}
            bind:shown={showFilterDlg}
        />
    </div>
    <div class=components>
        {#await python?.ready then ready}
            {#await profilesPending.components.promise}
                <div class=message>
                    {translate("Loading Components...")}
                </div>
            {:then}
                {#each sortProfiles(allProfiles.components) as [categ, categProfiles]}
                    {#if filterProfiles(categProfiles).length}
                        <ComponentSection label={categ}>
                            {#each filterProfiles(categProfiles) as profile}
                                {#if profile['__class__'].startsWith("psychopy.experiment.components") || profile['__class__'].endsWith("omponent")}
                                    <ComponentButton 
                                        component={profile}
                                    />
                                {:else}
                                    <RoutineButton 
                                        component={profile}
                                    />
                                {/if}
                            {/each}
                        </ComponentSection>
                    {/if}
                {/each}
            {:catch err}
                <div class="message error">
                    <div>
                        {translate("Failed to load Components.")}
                    </div>
                    <pre>
{err.error?.join?.("\n")}
                    </pre>
                </div>
            {/await}
        {/await}
    </div>
</div>



<style>
    .ctrls {
        padding: .5rem;
        display: flex;
        gap: .5rem;
        border-bottom: 1px solid var(--overlay);
        justify-content: end;
    }

    .message {
        margin: 1rem;
        white-space: wrap;
    }
    .error {
        color: var(--red);
    }

    pre {
        white-space: wrap;
        word-break: break-all;
        border: 1px solid var(--crust);
        background: var(--base);
        border-radius: .5rem;
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: .5rem;
    }
</style>