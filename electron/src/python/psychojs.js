import { getVenv } from "./venv.js";
import { favicon } from "../resources.js";
import logging from "../logging.js";
import { getSafeAddress } from "./utils.js";
import { BrowserWindow } from "electron";


export class PsychoJSServer {
    constructor(cwd) {
        // store cwd
        this.cwd = cwd
        // populated upon start
        this.venv = undefined
        this.address = undefined
        this.process = undefined
        // ready markers
        this.ready = Promise.withResolvers();
        this.pending = []
    }

    static async run(cwd, params={}) {
        // parse params
        params = new URLSearchParams(params)
        // create new server
        let server = new PsychoJSServer(cwd)
        // start server
        let address =  await server.start()
        // open window
        let win = new BrowserWindow({
            icon: favicon,
            title: "PsychoJS Experiment",
            show: false,
        });
        win.maximize();
        // load experiment
        console.log(`http://${address}?${params.toString()}`)
        await win.loadURL(`http://${address}?${params.toString()}`);
        win.once("ready-to-show", win.show)
        // behaviour when closed...
        let finished = Promise.withResolvers();
        win.on("close", evt => {
            // mark as finished
            finished.resolve()
            // close server
            server.stop()
        });

        return await finished.promise
    }

    async start() {
        // get app venv
        this.venv = await getVenv("app")
        // mark started
        this.started = true
        // get a safe address
        this.address = await getSafeAddress()
        // store in servers array
        servers[this.address] = this
        // log start
        logging.log(`Starting PsychoJS server at ${this.address}`)
        // spawn a python process
        this.process = this.venv.spawn(
            [
                "-m", "http.server", this.address.replaceAll("localhost:", ""), "--directory", this.cwd
            ]
        )
        this.process.on("spawn", this.ready.resolve)
        this.process.on("error", this.ready.reject)
        // timeout after 1s
        setTimeout(this.ready.reject, 10000)
        // wait until ready
        await this.ready.promise
        logging.log("PsychoJS server started")

        return this.address
    }

    stop() {
        return this.process.kill()
    }
}

const servers = {}


export function getPsychoJSServer(address) {
    return servers[address]
}