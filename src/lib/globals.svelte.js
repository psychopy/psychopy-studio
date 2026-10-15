// if running from electron or web, these will be set by the corresponding runtime, otherwise will be undefined
export var electron = $state(window.electron | window.web) 
export var git = $state(window.git)
export var python = $state(window.python)
// global stores for pavlovia and hardware stuff
export var devices = $state({})
export var projects = $state({})
export var users = $state({})
// global stores for UI stuff
export var panels = $state([])