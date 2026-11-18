<script>
    import { validateCode } from "./validators.svelte.js";
    import { CodeEditor } from "$lib/ui/code";

    let {
        /** @prop @type {import("$lib/experiment").Param} Param object to which this ctrl pertains */
        param=$bindable(),
        /** @prop @type {boolean} Controls whether this control is disabled */
        disabled=false,
        /** @interface */
        ...attachments
    } = $props()

    let language = $derived(
        param.allowedVals ? param.allowedVals : "python"
    )

</script>

<div class=container>
    <div 
        class=param-code-input-multi
        id={param.name}
        aria-label={param.label}
        {@attach element => param.registerValidator("code", validateCode, 10)}
        {...attachments}
    >
        <CodeEditor 
            bind:value={param.val}
            language={language}
            readonly={disabled}
            disabled={disabled}
        />
    </div>
</div>

<style>
    .container {
        position: relative;
        width: 100%;
    }
    .param-code-input-multi {
        position: absolute;
        inset: 0;
        border: 1px solid var(--overlay);
        padding: .5rem;
    }
</style>