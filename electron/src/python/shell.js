import { randomUUID } from "node:crypto";
import { decoder, output } from "./utils.js";
import logging from "../tools/logging.js";
import proc from "child_process";


export class PythonShell {

  tokens = {
    stdout: {
      start: "###START-STDOUT###",
      stop: "###END-STDOUT###"
    },
    stderr: {
      start: "###START-STDERR###",
      stop: "###END-STDERR###"
    },
  }

  constructor(venv) {
    // store venv
    this.venv = venv
    // populated upon start
    this.process = undefined
    // create a random id
    this.id = randomUUID();
    // setup completion promises
    this.started = Promise.withResolvers()
    this.started.promise.finally(
        evt => {
          logging.log(`Started shell ${this.id} (python=${this.venv.pythonVersion}, psychopy=${this.venv.psychopyVersion})`)
          this.venv.shells[this.id] = this
        }
    )
    this.finished = Promise.withResolvers()
    this.finished.promise.finally(
        evt => {
          logging.log(`Closed shell ${this.id}`)
          delete this.venv.shells[this.id]
        }
    )
  }

  start() {
    // create process
    this.process = proc.spawn(
      this.venv.executable, 
      ['-i']
    );
    // mark started 
    this.started.resolve()
    // map finished callback
    this.process.on("close", this.finished.resolve)
    // handle failure to launch
    this.process.on("error", err => {
      logging.error(`Shell ${this.id} failed to launch: ${err.message}`)
      output("stderr", `Python shell failed to launch: ${err.message}`)
    })
    // import sys from start
    this.send("import sys")
  }

  stop() {
    this.process.kill()
  }

  send(msg, timeout=2000) {
    let thusfar = {
      message: [],
      stdout: false,
      stderr: false
    };

    // listen for returned values
    let promise = new Promise((resolve, reject) => {
      for (let src of ["stdout", "stderr"]) {
        // define a listener function for this source
        let lsnr = resp => {
          // decode
          let value = decoder.decode(resp)
          // sanitize
          let safevalue = value
            .replaceAll(this.tokens[src].stop, "")
            .replaceAll(">>> ", "")
            .trim()
          // store sanitized value
          if (safevalue) {
            thusfar.message.push(safevalue)
          }
          // stop listening if end of input
          if (value.includes(this.tokens[src].stop)) {
            thusfar[src] = true
            this.process[src].removeListener("data", lsnr)
          }
          // if done, resolve
          if (thusfar.stdout && thusfar.stderr) {
            resolve(thusfar.message)
          }
        }
        // start listening
        this.process[src].on("data", lsnr)
        // stop listening on timeout
        setTimeout(evt => {
          resolve(thusfar.message)
          this.process[src].removeListener("data", lsnr)
        }, timeout)
      }
    })
    // store message for return
    for (let line of msg.split("\n").filter(line => line.length > 0)) {
      thusfar.message.push(
        `>> ${line}`
      )
    }
    
    // send message
    this.process.stdin.write(
      `${msg}\nprint("${this.tokens.stdout.stop}", file=sys.stdout)\nprint("${this.tokens.stderr.stop}", file=sys.stderr)\n`
    );
    
    return promise
  }
}