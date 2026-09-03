<script>
    import { Menu, MenuItem } from "$lib/utils/menu";
    import { TreeNode } from "$lib/utils/tree";
    import { parsePath } from "$lib/utils/files";
    import path from "path-browserify";
    import { electron } from "$lib/globals.svelte";
    import { getContext } from "svelte";
    import { translate } from "$lib/translation";

    let {
        value
    } = $props()

    let fileIcons = {
        ".txt": "text",
        ".md": "text",
        ".log": "text",
        ".json": "json",
        ".yaml": "json",
        ".yml": "json",
        ".toml": "json",
        ".tml": "json",
        ".xml": "json",
        ".psydat": "json",
        ".csv": "table",
        ".xlsx": "table",
        ".xls": "table",
        ".tsv": "table",
        ".png": "image",
        ".jpeg": "image",
        ".jpg": "image",
        ".bmp": "image",
        ".tiff": "image",
        ".tif": "image",
        ".ppm": "image",
        ".gif": "image",
        ".svg": "design",
        ".psd": "design",
        ".ai": "design",
        ".afdesign": "design",
        ".afphoto": "design",
        ".xcf": "design",
        ".vsd": "design",
        ".cdr": "design",
        ".cdx": "design",
        ".drawio": "design",
        ".mp4": "video",
        ".mov": "video",
        ".avi": "video",
        ".wmv": "video",
        ".webm": "video",
        ".mpeg": "video",
        ".mp3": "audio",
        ".wav": "audio",
        ".aac": "audio",
        ".wma": "audio",
        ".flac": "audio",
        ".m4a": "audio",
        ".psyexp": "psyexp",
        ".psyrun": "psyrun",
        ".py": "python",
        "pyproject.toml": "packaging",
        ".whl": "packaging",
        ".wheel": "packaging",
        ".js": "js",
        ".html": "html",
        ".css": "css",
        ".git": "git",
        ".gitignore": "git",
        ".gitattributes": "git",
        "README.md": "info",
        "readme.md": "info",
    }

    let current = getContext("current")

    function selectFile(evt, data) {
        // iterate through open pages
        for (let [i, page] of Object.entries(current.pages)) {
            // if page shows the given file...
            if (page.file.file === data.file) {
                // ...navigate to it
                current.tab = parseInt(i)
                // return true so we know we hit something
                return true
            }
        }
    }

    function openFile(evt, data) {
        // if file is already open, navigate to it
        if (selectFile(evt, data)) {
            return
        }
        // otherwise, open it
        current.openFile(data)
    }

    let contextMenu = $state({
        shown: false,
        pos: {
            x: undefined,
            y: undefined
        }
    })
</script>


<TreeNode 
    label={parsePath(value || "").name}
    icon="/icons/filetypes/{fileIcons[parsePath(value || "").ext] || "unknown"}.svg"
    data={parsePath(value)}
    onselect={selectFile}
    onactivate={openFile}
    oncontextmenu={(evt, data) => {
        evt.preventDefault();
        // show menu
        contextMenu.shown = true;
        // set its position to the mouse pos
        contextMenu.pos.x = evt.pageX;
        contextMenu.pos.y = evt.pageY;
    }}
/>

<Menu
    bind:shown={contextMenu.shown}
    bind:position={contextMenu.pos}
>
    <MenuItem 
        label={translate("Reveal in file explorer")}
        onclick={async (evt, data) => {
            await electron.files.showItemInFolder(value)
            contextMenu.shown = false
        }}
    />
</Menu>