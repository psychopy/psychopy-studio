<script>
    import semver from "semver";
    import { translate } from "$lib/translation";

    let {
        param=$bindable(),
        /** @prop @type {boolean} Controls whether this control is disabled */
        disabled=false,
        /** @interface */
        ...attachments
    } = $props()

    function validateVersion(param, valid) {
        valid.value = true
    }
    
    // construct options live from the param's allowedVals and allowedLabels attributes
    let options = $derived.by(async () => {
        // use allowedVals to get versions from GitHub
        let resp = await fetch(
            `https://api.github.com/repos/${param.allowedVals}/tags`, 
            {method: "GET"}
        );
        let versions = (await resp.json()).map(
            ver => semver.parse(ver.name)
        ).toSorted(semver.compare).toReversed()
        // sort by version
        options = {}
        for (let ver of versions) {
            let minor = `${ver.major}.${ver.minor}`
            // if minor version not included yet, add a field for it
            if (!(minor in options)) {
                options[minor] = []
            }
            // add to minor version's field
            options[minor].push(
                [ver.format(), ver.format()]
            )
        }

        return options
    })
</script>

<select 
    class=param-version-input
    disabled={disabled || param.allowedVals.length == 1} 
    bind:value={param.val}
    id={param.name}
    style:color={param.valid.value ? "inherit" : "var(--red)"}
    {@attach element => param.registerValidator("version", validateVersion, 0)}
    {...attachments}
>
    {#await options}
        <option value="">{translate("Fetching versions from GitHub...")}</option>
    {:then options}
        <option value="">{translate("latest")}</option>
        {#each Object.entries(options) as [minor, versions]}
            <optgroup label={minor}>
                <option 
                    value={`${minor}.*`} 
                    selected={param.val === `${minor}.*`}
                >{minor} ({translate("final")})</option>
                {#each versions as [version, label]}
                    <option 
                        value={version} 
                        selected={param.val === version}
                    >{label}</option>
                {/each}
            </optgroup>
            
        {/each}
    {/await}
</select>

<style>
    .param-version-input {
        flex-grow: 1;
    }
</style>