<script>
    import { optionsFromParam } from "./utils.js";
    import { translate } from "$lib/translation";

    let {
        param=$bindable(),
        /** @prop @type {boolean} Controls whether this control is disabled */
        disabled=false,
        /** @interface */
        ...attachments
    } = $props()

    function validateRichChoice(param, valid) {}
</script>

<div 
    class=param-rich-choice-ctrl
    {@attach element => param.registerValidator("richChoice", validateRichChoice, 0)}
    {...attachments}
>
    {#await optionsFromParam(param)}
        {translate("Loading...")}
    {:then options}
        {#each options as [val, details]}
            <button
                class=rich-ctrl-item
                class:selected={param.val === val}
                onclick={(evt) => param.val = val}
            >
                <h4>{details.label}</h4>
                <p>{details.body}</p>
                {#if details.link}
                <a href={details.link}>{details.linkText}</a>
                {/if}
            </button>
        {/each}
    {:catch}
        {translate("Failed to load options.")}
    {/await}
</div>

<style>
    .param-rich-choice-ctrl {
        display: flex;
        flex-direction: column;
        justify-content: stretch;
        gap: .5rem;
        flex-grow: 1;
    }

    .rich-ctrl-item {
        padding: 1rem;
        border: 1px solid var(--overlay);
        border-radius: .5rem;
        opacity: 80%;
        transition: opacity .2s border-color .2s background-color .2s;
        display: flex;
        flex-direction: column;
        align-items: start;
        text-align: left;
    }

    .rich-ctrl-item.selected,
    .rich-ctrl-item:hover {
        border-color: var(--blue);
        background-color: var(--base);
    }
    .rich-ctrl-item.selected {
        opacity: 100%;
    }
</style>