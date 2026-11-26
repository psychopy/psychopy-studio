<script>
    import { Button } from "$lib/ui/button";
    import { python } from "$lib/globals.svelte";
    import { getContext, onMount } from "svelte";
    import { fly } from "svelte/transition";
    import { translate } from "$lib/translation";

    /**
     * @typedef {Object} Alert
     * @property {number} code The 4 digit code corresponding to this alert in PsychoPy's alerts catalogue
     * @property {string} cat The category of the alert
     * @property {string} msg The message contents of the alert itself
     * @property {string} [type] Type of the Component/Routine which generated the alert 
     * @property {string} [name] Name of the Component/Routine which generated the alert
     * @property {string} [file] Experiment file which generated the alert
     * @property {Array<string>} trace Python traceback for where the event happened, if supplied
     * 
     * 
     * @typedef {Object} Props
     * @property {Array<{tag: "alert", message: Alert}>} alerts Array of alerts to present
     * @property {(message: Alert) => boolean} filter Function to filter arrays by (accepts all if unspecified)
     * @property {Snippet} [ctrls] Snippet containing any controls to draw on this control
     * @property {boolean} subscribe Subscribe to alerts when this component mounts
     * 
     * @type {Props}
     */
    let {
        alerts=$bindable(),
        filter=(message) => true,
        ctrls=undefined,
        subscribe=false
    } = $props()

    // filter alerts array
    let filteredAlerts = $derived(
        alerts.filter(filter)
    )
    onMount(() => {
        if (subscribe) {
            // setup listener for alerts
            python.liaison.listen("alert", 
                (evt, message) => {
                    // if this code isn't already in the array, add it
                    if (!alerts.some(
                        item => (
                            // same code
                            item.code === message.message.code
                            // same experiment
                            && item.file === message.message.file
                            // same element
                            && item.name === message.message.name
                        )
                    )) {
                        alerts.push(message.message);
                    }
                }
            )
        }
    })

</script>


<div class=alerts-output>
    <div class=alerts-array>
        {#each filteredAlerts as message}
            <div class=alert transition:fly>
                <h3>{translate("{} Alert").replace("{}", message.cat)}</h3>
                <code class=alert-code>
                    #{message.code}
                </code>
                <span class=alert-msg>
                    {message.msg}
                </span>
                <a 
                    href="https://docs.psychopy.org/alerts/{message.code}.html"
                    style:grid-column-start=content
                    target="_blank"
                >{translate("More info")}</a>
            </div>
        {/each}
    </div>
    {#if ctrls}
        <div class=alerts-ctrls>
            {@render ctrls()}
        </div>
    {/if}
</div>

<style>
    .alerts-output {
        display: flex;
        flex-direction: row;
        align-items: stretch;
        gap: .5rem;
        flex-grow: 1;
    }
    .alerts-ctrls {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: start;
        padding: .5rem;
        gap: .5rem;
        box-sizing: border-box;
        border-left: 1px solid var(--overlay);
        flex-grow: 0;
    }
    .alerts-array {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        overflow-y: auto;
        overflow-anchor: auto;
        margin: 0;
        flex-grow: 1;
        gap: .5rem;
        padding: 1rem;
    }

    .alert {
        display: grid;
        gap: .5rem;
        grid-template-columns: [content] 1fr [code] min-content;
        background-color: var(--base);
        border: 1px solid var(--overlay);
        padding: 1rem;
        border-radius: .5rem;
    }
    .alert h3 {
        margin-top: 0;
        margin-bottom: .5rem;
    }
    .alert-code {
        opacity: 50%;
    }
</style>