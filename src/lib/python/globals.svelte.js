// store progress for setting up Python
export var status = $state({
    ready: Promise.withResolvers(),
    dismiss: Promise.withResolvers(),
    message: "",
    logs: "",
    dlg: {
        message: "",
        shown: false,
        busy: false
    },
})
