import proc from "child_process";
import { app } from "electron";
import logging from "./logging.js";
import { isDev } from "./version.js";
import path from "node:path";

// details about the Svelte instance
export var details = {
  address: {
    host: "localhost",
    port: 8003,
  },
  process: undefined,
  ready: Promise.withResolvers()
};


/**
 * Setup API handlers to be called within Svelte
 */
function setupAPI(server) {
    /**
     * Make a GET request
     * 
     * @param req Request object passed directly from `server.get`
     * @param res Response object passed directly from `server.get`
     * @param {string} url URL to call via GET
     */
    async function apiGet(
        req, 
        res,
        url
    ) {
        try {
            // make fetch request
            let data = await fetch(
                url
            ).then(
                resp => resp.json()
            );
            // return result
            res.json(data)
        } catch (error) {
            // return error if this fails
            res.status(
                500
            ).json({
                error: error.message
            })
        }
    }

    /**
     * Make a POST request
     * 
     * @param req Request object passed directly from `server.post`
     * @param res Response object passed directly from `server.post`
     * @param {string} url URL to call via POST
     * @param {object} content Content to send in the POST request
     * 
     */
    async function apiPost(
        req, 
        res,
        url, 
        { headers: headers={}, body: body="{}"}
    ) {
        try {
            // make fetch request
            let data = await fetch(
                url, 
                {
                    method: "POST",
                    headers: headers,
                    body: body
                }
            ).then(
                resp => resp.json()
            );
            // return result
            res.json(data)
        } catch (error) {
            // return error if this fails
            res.status(
                500
            ).json({
                error: error.message
            })
        }
    }

    // API for getting plugins list
    server.get('/api/plugins', async (req, res) => await apiGet(
        req, 
        res,
        "https://psychopy.org/plugins.json"
    ));
    console.log("Mapped API: Get plugins list")

    // API for submitting a bug to clickup from dogfood release
    server.post('/api/report', async (req, res) => {
        // post request to clickup to create a task
        let data = await apiPost(
            req,
            res,
            "https://api.clickup.com/api/v2/list/128673336/task",
            {
                headers: {
                    "Authorization": req.body.token,
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name: req.body.title,
                    description: req.body.description,
                    priority: req.body.priority,
                    custom_fields: [
                        { id: "1cc82c18-79c6-470b-aa63-b39a108afe90", value: ["39244b7f-eea7-47d2-8760-418d86dc525d"] },
                        { id: "90ee49a2-01ce-49be-a3bb-c7b12160eb03", value: req.body.email },
                        { id: "e649173f-4f1a-4275-abff-1e699962eda1", value: req.body.version.match(/(?<=\w+)\d+$/)?.[0] || "" }
                    ]
                })
            },
            (code, err) => res.status(500).json({ error: error.message})
        )
        
        // post additional requests to add comments with details
        for (let [name, content] of [
            ["last_app_load.log", req.body.logs.app],
            ["liaison.log", req.body.logs.liaison],
            ["context.json", JSON.stringify(req.body.context, undefined, 4)]
        ]) {
            await apiPost(
                `https://api.clickup.com/api/v2/task/${data.id}/comment`,
                {
                    headers: {
                        "Authorization": req.body.token,
                        "Accept": "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        notify_all: false,
                        comment_text: `${name}\n---\n${content}\n`
                    })
                },
                (code, err) => res.status(500).json({ error: `Failed to post comment: ${error.message}`})
            )
        }
        // return what we got back
        res.json(data);
    });
    console.log("Mapped API: Submit a bug report to ClickUp")

    // API for getting user's surveys
    server.get('/api/surveys', async (req, res) => await apiGet(
        req,
        res,
        `https://pavlovia.org/api/v2/surveys?oauthToken=${req.headers.access}`
    ));
    console.log("Mapped API: Get user's Pavlovia surveys")

    // handle SPA fallback without wildcard
    server.use((req, res) => {
        res.sendFile(path.join(import.meta.dirname, '../../dist/index.html'));
    });
}

/**
 * Start a server running the Svelte app; will run as dev or not according to packaging state
 */
export async function startSvelte() {
    /**
     * Start a vite dev server running the Svelte app
     */
    async function startSvelteDev() {
        logging.log(`Starting Vite dev server at ${details.address.host}:${details.address.port}`)
        // start process
        details.process = proc.exec(
            `vite dev --host=${details.address.host} --port=${details.address.port}`
        );
        // listen to stdout
        details.process.stdout.on("data", msg => {
            // look for ready message
            let readyMatch = msg.match(
                /➜  Local:   http:\/\/(?<host>[\w\d]+):(?<port>[\w\d]+)/
            )
            // if this is it...
            if (readyMatch) {
                // store final host and port
                details.address.host = readyMatch.groups.host
                details.address.port = readyMatch.groups.port
                // mark as ready
                details.ready.resolve()
                // log
                logging.log(
                    `Started Vite dev server at ${details.address.host}:${details.address.port}`
                )
            }
        })

        return details.ready.promise
    }


    /**
     * Start a server hosting the static, packaged Svelte app
     */
    async function startSvelteStatic() {
        logging.log(`Running: ${process.argv.join(" | ")}`)
        // create an "express" server
        let { default: express } = await import('express');
        let expressApp = express();
        // point to the static files
        expressApp.use(
            express.static(path.join(import.meta.dirname, '../../dist'))
        );
        // setup API
        setupAPI(expressApp)
        // listen for messages
        let server = expressApp.listen(details.address.port, details.address.host, evt => {
            // on first message, mark as ready
            details.ready.resolve();
            // log
            logging.log(`Started static server at ${details.address.host}:${details.address.port}`)
        });
        // emulate command line process
        details.process = { 
            kill: () => server.close() 
        };

        return details.ready.promise
    }

    
    // start Svelte server
    if (isDev) {
        return await startSvelteDev()
    } else {
        return await startSvelteStatic()
    }
}
