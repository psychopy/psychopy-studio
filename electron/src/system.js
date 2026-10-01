/**
 * Request permission to access global keypresses on Mac
 */
export async function requestKeyboardAccess() {
    // skip if not on Mac
    if (process.platform !== 'darwin') {
        return
    }
    // get permissions package
    let permissions = (await import("node-mac-permissions")).default
    // request permission for input monitoring (only prompts if not yet determined)
    if (permissions.getAuthStatus("input-monitoring") !== "authorized") {
        permissions.askForInputMonitoringAccess()
    }
    // request permission from the accessibility section
    if (permissions.getAuthStatus("accessibility") !== "authorized") {
        permissions.askForAccessibilityAccess()
    }
}


/**
 * Check whether we have keyboard access
 */
export async function hasKeyboardAccess() {
    // skip if not on Mac
    if (process.platform !== 'darwin') {
        return true
    }
    // get permissions package
    let permissions = (await import("node-mac-permissions")).default
    // check permissions
    return (
        permissions.getAuthStatus("input-monitoring") === "authorized" 
        && permissions.getAuthStatus("accessibility") === "authorized" 
    )
}