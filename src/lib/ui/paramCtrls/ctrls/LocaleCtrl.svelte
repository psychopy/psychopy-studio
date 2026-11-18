<script>
    import { validateLocale } from "./validators.svelte.js";
    import { locales, getLocale, setLocale, translate } from "$lib/translation";
    import { getByTag } from "locale-codes";

    let {
        param=$bindable(),
        /** @prop @type {boolean} Controls whether this control is disabled */
        disabled=false,
        /** @interface */
        ...attachments
    } = $props()
</script>


<select 
    class=param-locale-input
    aria-label={param.label}
    disabled={disabled || locales.length === 0} 
    bind:value={param.val}
    style:color={param.valid.value ? "inherit" : "var(--red)"}
    id={param.name}
    {@attach element => param.registerValidator("locale", validateLocale, 0)}
    {...attachments}
>
    <option
        value="system locale"
        selected={param.val === ""}
    >
        {translate("System language")}
    </option>
    {#each locales as option}
        {@const language = getByTag(option.replace("_", "-"))}
        <option 
            value={option} 
            selected={param.val === option}
        >
            {#if language}
                {language.name}
                {#if language.local && language.local !== language.name}
                    {language.local}
                {/if}
                {#if language.location}
                    ({language.location})
                {/if}
            {:else}
                {option}
            {/if}
        </option>
    {/each}
</select>


<style>
    .param-locale-input {
        flex-grow: 1;
    }
</style>