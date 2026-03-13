import { HasParams } from "./param.svelte";
import { Routine, StandaloneRoutine } from "./routine.svelte";


export class Flow {

    flat = $state([]);
    dynamic = $derived.by(() => {
        // construct flow
        let dynamic = [];
        let currentLoop = this;
        for (let rt of this.flat) {
            // iterate through a flattened flow
            if (rt instanceof LoopInitiator) {
                // create a loop when we get to an initiator
                let loop = new FlowLoop(
                    rt,
                    currentLoop
                );
                // is it terminated?
                loop.terminator = this.flat.find(
                    emt => emt instanceof LoopTerminator && emt.name === rt.name
                )
                // add to the current loop
                if (currentLoop instanceof Flow) {
                    dynamic.push(loop);
                } else {
                    currentLoop.routines.push(loop);
                }
                // set as the current loop (only if terminated)
                if (rt.complete) {
                    currentLoop = loop;
                }
            } else if (rt instanceof LoopTerminator) {
                // close current loop, if any
                if (currentLoop instanceof Flow) {
                    logging.warn(
                        `Found Loop Terminator (${rt.name}) with no matching Loop Initiator."`
                    )
                } else {
                    currentLoop = currentLoop.parent;
                }
            } else {
                if (currentLoop instanceof Flow) {
                    dynamic.push(rt);
                } else {
                    currentLoop.routines.push(rt);
                }
            }
        }

        return dynamic;
    });

    // dynamic list of all loop objects in this flow
    loops = $derived(
        this.flat.filter(
            item => item instanceof LoopInitiator
        )
    )

    constructor(exp) {
        this.exp = exp;
    }

    /**
     * Remove all items from the flow
     */
    clear() {
        this.flat.length = 0;
    }

    removeElement(index) {
        // convert index to int
        index = parseInt(index);
        // pop from flat array
        this.flat.splice(index, 1);
    }

    relocateElement(element, toIndex) {
        // get element index
        let fromIndex = this.flat.indexOf(element);
        // convert indices to int
        toIndex = parseInt(toIndex);
        // if this changes the indices, adjust
        if (toIndex > fromIndex) {
            toIndex -= 1;
        }
        // if toIndex was -1, move to end
        if (toIndex < 0) {
            toIndex = this.flat.length;
        }
        // pop element from flat array
        this.flat.splice(
            fromIndex, 1
        );
        // insert back in at new position
        this.flat.splice(
            toIndex, 0, element
        );
    }

    insertElement(element, index) {
        // convert index to int
        index = parseInt(index);
        // if toIndex was -1, move to end
        if (index < 0) {
            index = this.flat.length;
        }
        // insert
        this.flat.splice(
            index, 0, element
        );
    }

    toJSON() {
        let node = [];
        // iterate through items
        for (let item of this.flat) {
            // for Routines, just add name as they're defined elsewhere
            if (item instanceof Routine || item instanceof StandaloneRoutine) {
                node.push({ ref: item.name });
                continue;
            }
            // anything else, use its JSON method
            node.push(item.toJSON());
        }

        return node;
    }

    fromJSON(node) {
        // clear self
        this.clear();
        // object to reference initiators as they're created
        let initiators = {};
        // iterate through items in node
        for (let profile of node) {
            // if profile is a ref to an extant object, get it
            if ("ref" in profile && profile.ref in this.exp.routines) {
                this.flat.push(
                    this.exp.routines[profile.ref]
                );
                continue;
            } else if ("ref" in profile) {
                // if profile is a ref to a non-existent object, error
                throw Error(`Reference to nonexistant Routine ${profile.ref} in flow`);
            }
            // if profile is a loop initiator, recreate it
            if (LoopInitiator.tags.includes(profile.tag)) {
                // recreate
                let element = new LoopInitiator(profile.tag);
                element.exp = this.exp;
                element.fromJSON(profile);
                // add to flow
                this.flat.push(element);
                // store handle
                initiators[element.name] = element;
            }
            // if profile is a loop terminator, recreate it and link initiator
            if (profile.tag === "LoopTerminator") {
                // error if initiator doesn't exist
                if (!(profile.name in initiators)) {
                    throw Error(`Reference to nonexistant LoopInitiator ${profile.name} in LoopTerminator`);
                }
                // recreate
                initiators[profile.name].addTerminator();
                // add to flow
                this.flat.push(
                    initiators[profile.name].terminator
                );
            }
        }
    }

    toXML() {
        // create document
        let doc = document.implementation.createDocument(null, "xml");
        // create node
        let node = doc.createElement("Flow");
        // iterate through flat contents
        for (let emt of this.flat) {
            if (emt instanceof Routine || emt instanceof StandaloneRoutine) {
                let subnode = doc.createElement(emt.tag);
                subnode.setAttribute("name", emt.name);
                node.appendChild(subnode);
            } else {
                node.appendChild(
                    emt.toXML()
                );
            }
        }

        return node;
    }

    fromXML(node) {
        // clear self
        this.clear();
        // object to reference initiators as they're created
        let initiators = {};
        // iterate through items in node
        for (let elementNode of node.childNodes) {
            if (elementNode instanceof Text) {
                continue;
            }
            let name = elementNode.getAttribute("name");
            // if node is a loop initiator, recreate it
            if (elementNode.nodeName === "LoopInitiator") {
                // recreate
                let element = new LoopInitiator(
                    elementNode.getAttribute("loopType")
                );
                element.exp = this.exp;
                element.fromXML(elementNode);
                // add to flow
                this.flat.push(element);
                // store handle
                initiators[name] = element;
            } else if (elementNode.nodeName === "LoopTerminator") {
                // error if initiator doesn't exist
                if (!(name in initiators)) {
                    throw Error(`Reference to nonexistant LoopInitiator ${name} in LoopTerminator`);
                }
                // recreate
                initiators[name].addTerminator();
                // add to flow
                this.flat.push(
                    initiators[name].terminator
                );
            } else {
                if (name in this.exp.routines) {
                    this.flat.push(
                        this.exp.routines[name]
                    );
                    continue;
                } else {
                    // if profile is a ref to a non-existent object, error
                    throw Error(`Reference to nonexistant Routine ${name} in flow`);
                }
            }
        }
    }
}
export class FlowLoop {
    constructor(initiator, parent) {
        this.loopType = initiator.loopType;
        this.name = initiator.name;
        this.params = initiator.params;
        this.parent = parent;
        this.initiator = initiator;
        this.terminator = undefined;
        this.routines = [];
    }

    get complete() {
        return this.terminator !== undefined;
    }

    flatten() {
        let flat = [];
        for (let rt of this.routines) {
            if (rt instanceof FlowLoop) {
                flat.push(rt.initiator);
                for (let subrt of rt.flatten()) {
                    flat.push(subrt);
                }
                if (this.terminator !== undefined) {
                    flat.push(rt.terminator);
                }
            } else {
                flat.push(rt);
            }
        }

        return flat;
    }
}

export class LoopInitiator extends HasParams {

    loopType = $derived(() => this.params['loopType'].val);
    complete = $derived(this.terminator !== undefined);
    index = $derived(this.exp.flow.flat.indexOf(this))

    constructor(tag) {
        super(tag);
        this.exp = undefined;
        this.terminator = undefined;
    }

    addTerminator() {
        this.terminator = new LoopTerminator();
        this.terminator.exp = this.exp;
        this.terminator.initiator = this;
    }

    fromXML(node) {
        // load via parent method
        super.fromXML(node);
        // set tag from loopType rather than node name
        this.tag = node.getAttribute("loopType");
    }

    toXML() {
        // get node via parent method
        let node = super.toXML();
        // create a new node with the correct tag
        let newNode = node.ownerDocument.createElement("LoopInitiator");
        // copy inner content
        newNode.innerHTML = node.innerHTML;
        // copy attributes
        for (let attr of node.attributes) {
            newNode.setAttribute(attr.name, attr.value);
        }
        // put tag in loopType instead
        newNode.setAttribute("loopType", this.tag);

        return newNode;
    }
}

export class LoopTerminator {

    name = $derived(
        this.initiator?.name
    )

    constructor() {
        this.exp = undefined;
        this.initiator = undefined;
    }

    get index() {
        for (let i in this.exp.flow.flat) {
            if (this.exp.flow.flat[i] === this) {
                return i;
            }
        }
    }

    /**
     * Get this Component as a JSON string.
     */
    toJSON() {
        // create node
        let node = {
            tag: "LoopTerminator",
            name: this.name,
        };

        return node;
    }

    /**
     * Create a new Experiment from a JSON object
     *
     * @param {Object} node
     */
    static fromJSON(node) {
        // create a blank LoopInitiator
        let loop = new LoopTerminator();
        // populate settings
        loop.name = node.name;

        return loop;
    }

    toXML() {
        // create document
        let doc = document.implementation.createDocument(null, "xml");
        // create node
        let node = doc.createElement("LoopTerminator");
        node.setAttribute("name", this.name);

        return node;
    }

    static fromXML(node) {
        // make blank Loopterminator
        let terminator = new LoopTerminator();
        // populate info
        terminator.name = node.getAttribute("name");

        return terminator;
    }
}

