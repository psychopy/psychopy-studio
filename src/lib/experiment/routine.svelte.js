import { Component } from "./component.svelte";
import { HasParams } from "./param.svelte";


export class Routine {
    components = $state([]);

    visualStop = $derived.by(() => {
        // use visual stop from settings if there is one
        if (this.settings.visualStop) {
            return this.settings.visualStop;
        }
        // default to 1s
        let dur = 1;
        // use from Components if any
        for (let comp of this.components) {
            if (comp.visualStop > dur) {
                dur = comp.visualStop;
            }
        }

        return dur;
    });

    visualTicks = $derived.by(() => {
        // work out timeline increments based on routine duration
        let increment;
        if (this.visualStop < 2) {
            increment = 0.1;
        } else if (this.visualStop < 20) {
            increment = 1;
        } else if (this.visualStop < 200) {
            increment = 10;
        } else {
            increment = 100;
        }
        // work out duration to last increment
        let last_increment = Math.floor(this.visualStop / increment) * increment;
        // work out ticks for timeline grid
        var ticks = [];
        for (let tick = 0; tick <= last_increment - increment; tick += increment) {
            ticks.push({
                label: Math.round((tick + increment) * 100) / 100,
                proportion: 1
            });
        }
        // work out remainder for last section
        let remainder = (this.visualStop - last_increment) / increment;

        return {
            labels: ticks,
            remainder: remainder
        };
    });

    name = $derived.by(() => {
        if (this.settings) {
            return this.settings.params['name'].val;
        }
    });

    /**
     * Whether this Routine is disabled
     */
    disabled = $derived(this.settings.disabled);


    constructor() {
        this.tag = "Routine";
        this.exp = undefined;
        // placeholder settings
        this.settings = new Component("RoutineSettingsComponent");
        this.settings.routine = this;
    }

    /**
     * Search this element for a particular phrase
     */
    search(searchTerm, useRegex = false, caseSensitive = false) {
        let results = [];

        // search each component
        for (let comp of this.components) {
            results.push(
                ...comp.search(searchTerm, useRegex, caseSensitive)
            );
        }
        // search settings
        results.push(
            ...this.settings.search(searchTerm, useRegex, caseSensitive)
        );

        return results;
    }

    /**
     * List of all Static Components in this Experiment
     */
    updateTargets = $derived.by(() => {
        let targets = [];
        // iterate through Routines
        for (let comp of this.components) {
            if (comp.tag === "StaticComponent") {
                targets.push(comp);
            }
        }

        return targets;
    });

    addComponent(comp) {
        // add to Components array
        this.components.push(comp);
        // add reference to self
        comp.routine = this;
        // add reference to exp
        comp.exp = this.exp;
    }

    insertComponent(comp, index) {
        // convert index to int
        index = parseInt(index);
        // if toIndex was -1, move to end
        if (index < 0) {
            index = this.components.length;
        }
        // insert
        this.components.splice(
            index, 0, comp
        );
        // add reference to self
        comp.routine = this;
    }

    removeComponent(comp) {
        // remove from Components array
        let i = this.components.indexOf(comp);
        this.components.splice(i, 1);
    }

    get index() {
        for (let i in this.exp.flow.flat) {
            if (this.exp.flow.flat[i] === this) {
                return i;
            }
        }
    }

    relocateComponent(fromIndex, toIndex, toRoutine = this) {
        // convert indices to int
        fromIndex = parseInt(fromIndex);
        toIndex = parseInt(toIndex);
        // if this changes the indices, adjust
        if (toIndex > fromIndex && toRoutine === this) {
            toIndex -= 1;
        }
        // if toIndex was -1, move to end
        if (toIndex < 0) {
            toIndex = this.components.length;
        }
        // pop component from array
        let emt = this.components[fromIndex];
        this.removeComponent(emt);
        // insert back in at new position
        toRoutine.insertComponent(emt, toIndex);
    }

    /**
     * Get this Routine as a JSON string.
     */
    toJSON() {
        // create node
        let node = {
            tag: this.tag,
            name: this.name,
            settings: this.settings.toJSON(),
            components: [],
        };
        // add routines
        for (let component of this.components) {
            node.components.push(component.toJSON());
        }

        return node;
    }

    /**
     * Populate this Routine from a JSON
     *
     * @param {Object} node JSON object to populate from
     */
    fromJSON(node) {
        // clear Components
        Object.keys(this.components).forEach(key => delete this.components[key]);
        // populate settings
        this.settings.fromJSON(node.settings);
        // populate components
        for (let compNode of node.components) {
            // new component
            let comp = new Component(compNode.tag);
            comp.routine = this;
            // populate
            comp.fromJSON(compNode);
            // append
            this.addComponent(comp);
        }
    }

    toXML() {
        // create document
        let doc = document.implementation.createDocument(null, "xml");
        // create node
        let node = doc.createElement("Routine");
        node.setAttribute("name", this.name);
        // add settings
        node.appendChild(
            this.settings.toXML()
        );
        // add components
        for (let component of this.components) {
            node.appendChild(
                component.toXML()
            );
        }

        return node;
    }

    fromXML(node) {
        // parse Components
        for (let compNode of node.childNodes) {
            // skip blank nodes
            if (compNode instanceof Text) {
                continue;
            }
            // parse node
            let comp = new Component(compNode.nodeName);
            
            comp.fromXML(compNode);
            // add to either components list or settings attribute
            if (comp.tag === "RoutineSettingsComponent") {
                this.settings = comp;
                comp.routine = this;
                comp.exp = this.exp;
            } else {
                this.addComponent(comp)
            }
        }
    }
}
export class StandaloneRoutine extends HasParams {
    constructor(tag) {
        super(tag);
        this.tag = tag;
        this.exp = undefined;
    }

    get index() {
        for (let i in this.exp.flow.flat) {
            if (this.exp.flow.flat[i] === this) {
                return i;
            }
        }
    }

    /**
     * Mimics Routine.updateTargets, but as StandaloneRoutine has no children,
     * returns `[this]` if this Routine can be an update target (which currently
     *  none can)
     */
    updateTargets = $derived.by(() => {
        let targets = [];

        return targets;
    });
}

