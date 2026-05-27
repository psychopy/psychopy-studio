<script>
    import { TreeNode, TreeBranch } from "$lib/utils/tree"
    import OutlineNode from "./OutlineNode.svelte";
    import { parsePython, parseJavaScript } from "./parsers.js"
    import { current } from "../globals.svelte";

    let {
        content,
        index,
        type,
        name,
        top=false
    } = $props()

    let icons = {
        "Script.py": "/icons/nodetypes/Script.py.svg",
        "Script.js": "/icons/nodetypes/Script.js.svg",
        ClassDefinition: "/icons/nodetypes/ClassDefinition.svg",
        ClassDeclaration: "/icons/nodetypes/ClassDefinition.svg",
        FunctionDefinition: "/icons/nodetypes/FunctionDefinition.svg",
        FunctionDeclaration: "/icons/nodetypes/FunctionDefinition.svg",
    }

    let subnodes = $derived.by(() => {
        try {
            // parse Python file
            if ([".py"].includes(current.pages[current.tab].file.ext)) {
                return parsePython(content, index + 1)
            }
            // parse JS file
            if ([".js", ".cjs", ".ts"].includes(current.pages[current.tab].file.ext)) {
                return parseJavaScript(content, index + 1)
            }
        } catch (err) {
            console.error(err)
        }

        return []
    })

    function navigateTo() {
        // get current page
        let editor = current.pages[current.tab].editor;
        // work out line from character index
        let pos = editor.getModel().getPositionAt(index);
        // jump to line
        editor.revealPosition(pos)
        editor.setPosition(pos)
    }
    
</script>

{#if subnodes.length}
    <TreeBranch
        label={name}
        icon={icons?.[type]}
        onselect={navigateTo}
        open={top}
    >
        {#each subnodes as subnode}
            <OutlineNode 
                content={subnode.content}
                index={subnode.index}
                type={subnode.type}
                name={subnode.name}
            />
        {/each}
    </TreeBranch>
{:else if !top}
    <TreeNode 
        label={name}
        icon={icons?.[type]}
        onselect={navigateTo}
    />
{/if}
