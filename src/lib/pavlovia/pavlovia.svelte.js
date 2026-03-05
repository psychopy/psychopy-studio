export { default as UserCtrl } from "./UserCtrl.svelte";
export { default as ProjectCtrl } from "./ProjectCtrl.svelte";

import { randint, randof } from "$lib/utils/tools/random";
import { electron } from "$lib/globals.svelte";

export var users = $state({});
export var projects = $state({});

export async function loadProjects() {
    // no saved users if not in electron
    if (!electron) {
        return
    }
    // get file path
    let file = await electron.paths.pavlovia.projects();
    // get file contents
    let content = await electron.files.load(file);
    // parse JSON
    let data = JSON.parse(content);
    // apply
    Object.assign(users, data)

    return users
}

/**
 * Find the project associated with a given experiment
 * 
 * @param {Experiment} experiment Experiment to find project for
 * @param {object} user User whose credentials to use (determines visibility of projects)
 */
export async function findProject(experiment, user) {
    // return undefined if there is no user or no experiment file
    if (!experiment?.file?.parent || !user) {
        return
    }
    // get git remote
    let remote = await git.getRemote(
        $state.snapshot(experiment.file.parent), $state.snapshot(user)
    ).then(
        remote => remote ? new URL(remote) : remote
    )
    // only continue if there is a remote...
    if (remote) {
        // get name from remote URL
        let [_, group, name] = remote.pathname.match(/\/(.+?)\/(.+?)\.git/)
        // search GitLab
        let found = await fetch(
            `https://gitlab.pavlovia.org/api/v4/users/${group}/projects?search=${name}&access_token=${user.token.access}`
        ).then(
            resp => resp.json()
        )
        // if we found a project...
        if (found.length) {
            // log and return
            console.log(`Loaded project ${group}/${name}`, found[0])
            return found[0]
        }
    }
}

export var auth = $state({
    root: "https://gitlab.pavlovia.org",
    client: "944b87ee0e6b4f510881d6f6bc082f64c7bba17d305efdb829e6e0e7ed466b34",
    state: "",
    challenge: "",
    verifier: "",
    code: undefined
})


/**
 * Get the information for the current user as a catchable promise
 */
async function getUserInfo(token) {
    const resp = await fetch(`${auth.root}/api/v4/user?access_token=${token}`);
    if (resp.ok) {
        return await resp.json();
    } else {
        throw new Error(resp.statusText || 'Failed to get user info');
    }
}


/**
 * Uses the stored refresh token to refresh the stored access token
 */
async function refreshToken(username) {
    console.log("Refreshing Pavlovia authentication token...")
    // send request
    const resp = await fetch(
        `/api/token/refresh?${new URLSearchParams({
            root: auth.root,
            redirect: electron ? auth.root : window.location.href,
            client: auth.client,
            refresh: users[username].token.refresh,
            verifier: auth.verifier
        }).toString()}`,
        { method: "post" }
    );
    // if request failed, error so we can catch it further down
    if (!resp.ok) {
        throw new Error(`Token refresh failed: ${resp.statusText}`);
    }
    // get response
    const data = await resp.json();
    // store response
    if (data.access_token && data.refresh_token) {
        users[username].token.access = data.access_token;
        users[username].token.refresh = data.refresh_token;
    } else {
        throw new Error(data.message || 'Token refresh failed');
    }
    // queue up next refresh in case token expires this session
    setTimeout(
        evt => refreshToken(username), 
        data.expires_in
    )

    return data;
}


export async function login(username, current) {
    if (users[username]) {
        // if we have a stored access token...
        if (users[username].token?.access) {
            // always refresh the token
            await refreshToken(username);
            // try to get user info with current token
            try {
                const profile = await getUserInfo(users[username].token.access);
                users[username].profile = profile;
            } catch {
                // if refresh fails, clear the user's tokens and force new OAuth
                delete users[username].token;
                // now treat as new user
                return login(undefined, current);
            }
        } else {
            // otherwise, treat as new user
            return login(undefined, current);
        }
    } else {
        // if logging in from scratch...
        if (!auth.code) {
            // Reset OAuth state for fresh flow
            auth.state = String(crypto.randomUUID());
            auth.verifier = Array.from(
                { length: randint(44, 127) },
                () => randof("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._~")
            ).join("");
            // create a hash from verifier (via SHA-256 digestion)
            let hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(auth.verifier));
            // decode hash to make challenge
            auth.challenge = btoa(String.fromCharCode(...new Uint8Array(hash)))
                .replace(/\+/g, '-')
				.replace(/\//g, '_')
				.replace(/=+$/, '')
            ;
            // construct auth url params
            let params = new URLSearchParams({
                client_id: auth.client,
                redirect_uri: electron ? auth.root : window.location.href,
                response_type: "code",
                state: auth.state,
                code_challenge: auth.challenge,
                code_challenge_method: "S256"
            });
            // construct auth url
            let url = `${auth.root}/oauth/authorize?${params.toString()}`;
            // open authentication url
            if (electron) {
                // get code once ready
                auth.code = await electron.authenticatePavlovia(url);
            } else {
                // if running in browser, open in *this* window
                navigate(url);
                return;
            }
        }

        // request actual auth and refresh tokens
        let tokens = await fetch(
            `/api/token/authorize?${new URLSearchParams({
                root: auth.root,
                redirect: electron ? auth.root : window.location.href,
                client: auth.client,
                code: auth.code,
                verifier: auth.verifier
            }).toString()}`,
            { method: "post" }
        ).then(
            resp => resp.json()
        );
        if (tokens.error) {
            throw new Error(`Token request failed: ${tokens.error}, ${tokens.error_description}`);
        }

        // discard code now we're done with it (so we can log in as different users later)
        auth.code = undefined;

        // update profile
        let profileResp = await fetch(
            `${auth.root}/api/v4/user?access_token=${tokens.access_token}`
        );

        if (!profileResp.ok) {
            throw new Error(`Profile request failed: ${profileResp.statusText}`);
        }

        let profile = await profileResp.json();

        // get username incase they logged in as a different user
        username = profile.username;

        // create user
        if (username) {
            users[username] = {
                token: {
                    access: tokens.access_token,
                    refresh: tokens.refresh_token
                },
                profile: profile
            };
        } else {
            throw new Error("Failed to login - no username returned");
        }
    }

    // save users (if possible)
    if (electron) {
        try {
            const file = await electron.paths.pavlovia.users();
            await electron.files.save(file, JSON.stringify(users, undefined, 4));
        } catch (err) {
            console.warn('Failed to save user data:', err);
        }
    }

    return username;
}

export function logout() {
    // Only clear OAuth flow state (keep user tokens for 2-hour reuse)
    Object.assign(auth, {
        state: "",
        challenge: "",
        verifier: "",
        code: undefined
    });
}
