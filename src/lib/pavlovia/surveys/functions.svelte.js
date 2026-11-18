var surveysPromises = {}


export async function getSurveys(user) {
    // get surveys now if we haven't already for this user
    if (!surveysPromises[user]) {
        surveysPromises[user] = git.listSurveys(user)
    }
    
    return surveysPromises[user]
}
