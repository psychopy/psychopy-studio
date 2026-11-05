import { electron, git } from "$lib/globals.svelte";
import { browseFileOpen } from "$lib/utils/files";
import { openIn } from "$lib/utils/views.svelte";
import { translate } from "$lib/translation";
import path from "path-browserify";


export var projectsLoaded = $state({
    promise: git.loadProjects()
})


/**
 * Open the folder of a project to browse and open files
 * 
 * @param {string} folder Folder for the project
 * @returns 
 */
export async function openProject(folder) {
    // browse files
    let file = await browseFileOpen([
        { description: translate("PsychoPy Experiments"), accept: {"application/xml": [".psyexp"]} },
        { description: translate("Python Scripts"), accept: {"text/x-python-code": [".py"]} },
        { description: translate("JavaScript Scripts"), accept: {"text/javascript": [".js"]} }
    ], folder)
    // abort if cancelled
    if (!file) {
        return
    }
    // open in appropriate view
    if (file.ext === ".psyexp") {
        openIn(file.file, "builder")
    } else {
        openIn(file.file, "coder")
    }

    return file
}

/**
 * Clone a a given remote project to this machine
 */
export async function cloneProject(project, user) {
    // prompt user to choose folder
    let folder = await electron.files.openDialog({
        title: translate("Choose folder for Pavlovia project"),
        buttonLabel: translate("Clone"),
        properties: ["openDirectory"],
    })
    // abort if cancelled
    if (!folder) {
        return
    }
    // clone
    await git.clone(
        {
            group: project.split("/")[0],
            name: project.split("/")[1],
            folder: path.join(folder[0], project.split("/")[1])
        }, 
        user
    )
    // reload projects
    projectsLoaded.promise = git.loadProjects()
}

/**
 * Fork and clone a remote project to this machine
 */
export async function forkProject(project, user) {
    // create fork
    let newProject = await git.fork(
        {
            groupFrom: project.split("/")[0],
            groupTo: user,
            name: project.split("/")[1]
        },
        user
    )
    // clone new project
    return await cloneProject(newProject)
}

/**
 * Download files from remote project, detached (not cloned)
 */
export async function downloadProject(project, user) {
    // prompt user to choose folder
    let folder = await electron.files.openDialog({
        title: translate("Choose folder for downloaded project"),
        buttonLabel: translate("Download"),
        properties: ["openDirectory"],
    })
    // abort if cancelled
    if (!folder) {
        return
    }
    // create authenticated url
    let url = await git.authenticateURL(
        `https://gitlab.pavlovia.org/api/v4/projects/${encodeURIComponent(project)}/repository/archive.zip`,
        user
    )
    // create filename
    let filename = project.split("/").at(-1)
    // download folder
    await electron.files.downloadFolder(
        url,
        folder[0],
        filename
    )
    // add to projects.json
    await git.linkProject(project, path.join(folder[0], filename))
    // reload projects
    projectsLoaded.promise = git.loadProjects()
}