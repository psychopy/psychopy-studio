var demosPromise


export async function getDemos() {
    // get demos now if we haven't already
    if (!demosPromise) {
        demosPromise = fetch(
            "https://pavlovia.org/api/v2/experiments?search=demos&designer=demos"
        ).then(
            resp => resp.json()
        )
    }
    
    return demosPromise
}
