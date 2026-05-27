<script>
    let {
        value=$bindable()
    } = $props()
</script>


<select bind:value={value}>
    {#await python.venv.executable("app") then appExecutable}
        {#await python.uv.getEnvironments()}
            <option>
                Scanning Python environments...
            </option>
        {:then environments}
            {#each environments as env}
                <option value={env.executable === appExecutable ? "app" : env.psychopyVersion}>
                    {env.psychopyVersion}
                    {#if env.executable === appExecutable}
                        (default)
                    {/if}
                </option>
            {/each}
        {:catch err}
            <option>{err}</option>
        {/await}
    {/await}
</select>