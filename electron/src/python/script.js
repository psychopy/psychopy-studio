import { randomUUID } from "node:crypto";
import { output } from "./utils.js";
import proc from "child_process";
import path from "path";


export class PythonScript {
    constructor(venv, file, args) {
        // store venv
        this.venv = venv
        // store file and args
        this.file = file
        this.args = args
        // populated upon start
        this.process = undefined
        this.finished = undefined
    }

    async run() {
        // setup promise to track progress
        this.finished = Promise.withResolvers()
        // mark started
        output("stdout", `--- Started ${this.file} ---`)
        // split file into name and dir
        let folder = path.dirname(this.file)
        let file = path.basename(this.file)
        // execute asynchronously
        this.process = proc.spawn(
            this.venv.executable, 
            ["-u", file, ...this.args], 
            {cwd: folder}
        )
        // pass output to front end
        this.process.stdout.on("data", evt => output("stdout", evt))
        this.process.stderr.on("data", evt => output("stderr", evt))
        // await completion/error
        this.process.on("exit", (code, signal) => this.finished.resolve([code, signal]))
        this.process.on("error", err => this.finished.reject(err))
        // wait until finished
        let result = await this.finished.promise
        // mark finished
        output("stdout", `--- Finished ${this.file} ---`)

        return result
    }

    stop() {
        this.process.kill()
    }
}