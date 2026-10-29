<script>
    import ElementButton from './ElementButton.svelte';
    import ComponentSection from './Section.svelte';

    import { profiles as allProfiles, refresh } from '$lib/experiment/profiles.svelte';
    import FilterDialog from './FilterDialog.svelte';
    import { Button } from "$lib/ui/button";
    import { PluginManagerDlg } from "$lib/dialogs/pluginManager"
    import { electron, python } from "$lib/globals.svelte";
    import { translate } from "$lib/translation";
    import { Component, StandaloneRoutine } from "$lib/experiment";

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
     * Create an element from a profile, to be used as the template for an ElementButton
     * 
     * @param profile { object } Component or Routine profile
     * 
     * @returns { Component|StandaloneRoutine } Element created from the profile
     */
    function elementFor(profile) {
        if (profile['__class__'].startsWith("psychopy.experiment.components") || profile['__class__'].endsWith("omponent")) {
            return new Component(profile['__name__'])
        } else {
            return new StandaloneRoutine(profile['__name__'])
        }
    }

    /**
     * Get Components again from PsychoPy
     */
    async function refreshProfiles() {
        if (await python?.ready) {
            await refresh("components", 100000, true)
        }
    }

    let showFilterDlg = $state.raw(false);
    let showPluginMgr = $state.raw(false);
    let filter = $state()
</script>
<div id="components">
    <div class=ctrls>
        {#if python?.ready}
            <Button
                icon="/icons/btn-add.svg"
                tooltip={translate("Get more...")}
                onclick={evt => showPluginMgr = true}
                small
            />
            <PluginManagerDlg 
                bind:shown={showPluginMgr}
            />
            <Button
                icon="/icons/btn-refresh.svg"
                tooltip={translate("Reload Components")}
                onclick={refreshProfiles}
                disabled={!allProfiles.components.pending.resolved && !allProfiles.components.pending.rejected}
                small
            />
        {/if}
        <Button
            icon="/icons/btn-filter.svg"
            tooltip={translate("Filter...")}
            onclick={evt => showFilterDlg = true}
            small
        />
        <FilterDialog
            bind:filter={filter}
            bind:shown={showFilterDlg}
        />
    </div>
    <div class=components>
        {#await python?.ready then ready}
            {#await allProfiles.components.pending.promise}
                <div class=message>
                    {translate("Loading Components...")}
                </div>
            {:then}
                {#each sortProfiles(allProfiles.components.value) as [categ, categProfiles]}
                    {#if filterProfiles(categProfiles).length}
                        <ComponentSection label={categ}>
                            {#each filterProfiles(categProfiles) as profile}
                                <ElementButton 
                                    element={elementFor(profile)}
                                />
                            {/each}
                        </ComponentSection>
                    {/if}
                {/each}
            {:catch err}
                <div class="message error">
                    <div>
                        {translate("Failed to load Components, see Python error for details.")}
                    </div>
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
</style>