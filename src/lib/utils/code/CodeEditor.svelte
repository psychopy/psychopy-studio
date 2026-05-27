<!-- credit to github@ala-garbaa-pro/svelte-5-monaco-editor-two-way-binding -->


<script>
    import loader from '@monaco-editor/loader';
    import { onMount } from 'svelte';
    import { prefs } from "$lib/preferences.svelte.js"

    let {
        value=$bindable(),
        editor=$bindable(),
        theme=$bindable(),
        canUndo=$bindable(),
        canRedo=$bindable(),
        readonly=$bindable(false),
        disabled=$bindable(false),
        lineNumbers=true,
        language=undefined,
        resize="none",
        file
    } = $props();

    let monaco = $state.raw();
    let container;

    // maps file extensions to languages
    let languages = {
        ".py": "python",
        ".js": "javascript",
        ".md": "markdown",
        ".html": "html",
        ".json": "json"
    }

    $effect(() => {
        // get palette from css variables
        let palette = {}
        for (let name of [
            "red",
            "purple",
            "blue",
            "green",
            "yellow",
            "orange",
            "base",
            "mantle",
            "crust",
            "overlay",
            "outline",
            "text"
        ]) {
            palette[name] = window.getComputedStyle(document.body).getPropertyValue(`--${name}`)
        }
        // setup theme spec from css variables
        let spec = {
            "base": "vs",
            "inherit": false,
            "rules": [
                // default
                { 'token': "", 'foreground': palette.text, 'background': palette.base },
                // data types
                { 'token': "string", 'foreground': palette.outline },
                { 'token': "number", 'foreground': palette.blue },
                // comments
                { 'token': "comment.block", 'fontStyle': "italic" },
                { 'token': "comment", 'foreground': palette.green},
                // keywords
                { 'token': "keyword", 'foreground': palette.red },
                { 'token': "type", 'foreground': palette.blue },
                // generic
                { 'token': "invalid", 'foreground': palette.red },
                { 'token': "emphasis", 'fontStyle': "italic" },
                { 'token': "strong", 'fontStyle': "bold" },
            ],
            "colors": {
                'editor.foreground': palette.text,
                'editor.background': palette.base,
                'editor.selectionBackground': palette.crust,
                'editor.inactiveSelection': palette.mantle,
                'editor.referenceHighlight': palette.red,
                'editorCursor.foreground': palette.red,
                'editorWhitespace.foreground': palette.mantle,
                'editorGutter.background': palette.mantle,
                'editorLineNumber.foreground': palette.outline,
                'editorLineNumber.activeForeground': palette.text,
                'editor.lineHighlightBackground': palette.crust,
                'scrollbar.shadow': palette.overlay,
            }
        }
        
        if (monaco) {
            // define theme
            monaco.editor.defineTheme(theme || "default", spec);
            // set theme
            monaco.editor.setTheme(theme || "default");
        }
    })

    onMount(() => {
        (async () => {
            // initialise monaco loader
            monaco = await loader.init();
            // figure out language from file
            if (!language) {
                language = languages[file?.ext] || "text"
            }
            // initialise editor
            editor = monaco.editor.create(container, {
                value,
                language,
                lineNumbers: lineNumbers ? "on" : "off",
                fontFamily: prefs.params['coderFont'].val || "JetBrains Mono",
                colorDecorators: false,
                lineHeight: 1.6,
                renderLineHighlight: "gutter",
                'bracketPairColorization.enabled': false,
                automaticLayout: true,
                overviewRulerLanes: 0,
                overviewRulerBorder: false,
                wordWrap: 'on',
                minimap: {enabled: false},
                readOnly: readonly
            });
            // connect editor value to bound value
            editor.onDidChangeModelContent((e) => {
                if (!e.isFlush) {
                    const updatedValue = editor?.getValue() ?? '';
                    value = updatedValue;
                }
                // update undo/redo bindables
                canUndo = editor.getModel().canUndo();
                canRedo = editor.getModel().canRedo();
            });
            // remeasure fonts once the editor has loaded
            document.fonts.ready.then(() => {
                monaco.editor.remeasureFonts()
            })
        })();
    });

    // dynamically update value
    $effect(() => {
        if (!readonly && !disabled && editor?.hasWidgetFocus?.()) {
            // not if editor is editable and has focus - will have updated already
            return
        }
        editor?.setValue?.(value)
    })

    // dynamically update readonly
    $effect(() => editor?.updateOptions?.({ readOnly: readonly }))
</script>

<div 
    class="container" 
    bind:this={container}
    style:resize={resize}
    style:overflow-y={resize !== "vertical" ? "hidden" : "auto"}
    style:overflow-x={resize !== "horizontal" ? "hidden" : "auto"}
    style:opacity={disabled ? "50%" : "100%"}
></div>

<style>
    .container {
        height: calc(100% + 1rem - .5px);
        width: calc(100% + 1rem - 1px);
        min-height: 10rem;
        margin: -0.5rem;
        overflow: auto;
        box-sizing: border-box;
    }
</style>