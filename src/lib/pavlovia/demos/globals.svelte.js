export const demosPromise = fetch(
    "https://pavlovia.org/api/v2/experiments?search=demos&designer=demos"
).then(
    resp => resp.json()
)