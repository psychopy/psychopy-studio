import { getVenv } from "./venv.js";
import { favicon } from "../resources.js";
import logging from "../logging.js";
import { getSafeAddress } from "./utils.js";
import { BrowserWindow, Menu } from "electron";
import path from "node:path";
import express from "express";
import http from "http";


export class PsychoJSServer {
    constructor(cwd) {
        // store cwd
        this.cwd = cwd
        // populated upon start
        this.address = undefined
        this.process = undefined
        this.win = undefined
        // ready markers
        this.ready = Promise.withResolvers();
        this.pending = []
    }

    static async run(cwd, params={}) {
        // parse params
        params = new URLSearchParams(params)
        // create new server
        let server = new PsychoJSServer(cwd)
        // open window
        server.win = new BrowserWindow({
            icon: favicon,
            title: "PsychoJS Experiment",
            show: false,
        });
        server.win.maximize();
        // setup window menu
        let menu = Menu.buildFromTemplate(menuTemplate)
        server.win.setMenu(menu)
        // on mac, we have to setup menu to update on focus (Windows and Linux windows have their own menu)
        if (process.platform === "darwin") {
            server.win.on("focus", evt => {
                Menu.setApplicationMenu(menu)
            })
        }
        // start server
        let address = await server.start()
        // load URL
        server.win.loadURL(`http://${address}?${params.toString()}`)
        server.win.once("ready-to-show", server.win.show)
        // behaviour when closed...
        let finished = Promise.withResolvers();
        server.win.on("close", evt => {
            // mark as finished
            finished.resolve()
            // close server
            server.stop()
        });

        return await finished.promise
    }

    async start() {
        // mark started
        this.started = true
        // get a safe address
        this.address = await getSafeAddress()
        let [host, port] = this.address.split(":")
        // store in servers array
        servers[this.address] = this
        // log start
        logging.log(`Starting PsychoJS server at ${this.address}`)
        // create a new express app
        let { default: express } = await import('express');
        let expressApp = express();
        // host static files
        expressApp.use(
            express.static(this.cwd)
        );
        // start listening for files
        this.process = expressApp.listen(port, host, evt => {
            // on first message, mark as ready
            this.ready.resolve();
            // log
            logging.log(`Started static server at ${host}:${port}`)
        });
        await this.ready.promise

        logging.log("PsychoJS server started")

        return this.address
    }

    stop() {
        return this.process.close()
    }
}

const servers = {}


export function getPsychoJSServer(address) {
    return servers[address]
}