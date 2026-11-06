<script>
    import TreeNode from "./TreeNode.svelte";
    import { parsePath } from "$lib/utils/files";
    
    let {
        /** @prop {string} file Path to the file this node represents */
        file,
        /** @prop {string|undefined} label Label to show on this node (if undefined, will use the file name) */
        label=undefined,
        /** @prop {string|undefined} icon Icon to show on this node (if undefined, will use the icon matching file ext) */
        icon=undefined,
        /** @prop {any} data Data associated with this node (if undefined, will use the parsed file path) */
        data=undefined,
        /** @prop {ComponentProps<typeof TreeNode>} props Any other props are passed on to the underlying TreeNode */
        ...props
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

    let parsedFile = $derived(parsePath(file || ""))
</script>

<TreeNode 
    label={label || parsedFile.name}
    icon={icon || `/icons/filetypes/${fileIcons[parsedFile.ext] || "unknown"}.svg`}
    data={data || parsedFile}
    {...props}
/>