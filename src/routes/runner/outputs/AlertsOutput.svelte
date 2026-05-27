<script>
    import { CompactButton } from "$lib/utils/buttons";
    import { python } from "$lib/globals.svelte";
    import { getContext } from "svelte";
    import { fly } from "svelte/transition";
    import { translate } from "$lib/translation";

    let current = getContext("current")
</script>


<div class=alerts-output>
    <div class=alerts-array>
        {#each current.output.alerts as message}
            <div class=alert transition:fly>
                <h3>{message.cat} Alert</h3>
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
                >More info</a>
            </div>
        {/each}
    </div>
    <div class=alerts-ctrls>
        <CompactButton
            icon="/icons/btn-clear.svg"
            onclick={evt => current.output.alerts.length = 0}
            tooltip={translate("Clear alerts")}
        />
    </div>
</div>

<style>
    .alerts-output {
        display: flex;
        flex-direction: row;
        align-items: stretch;
        gap: .5rem;
        height: 100%;
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