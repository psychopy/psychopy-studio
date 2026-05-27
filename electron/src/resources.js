import path from "node:path";


// figure out best file to use for a favicon
export var favicon = path.join(import.meta.dirname, 'favicon')
if (process.platform === "win32") {
  favicon += ".ico"
} else if (process.platform === "darwin") {
  favicon += ".icns"
} else {
  favicon += "@1024x1024.png"
}