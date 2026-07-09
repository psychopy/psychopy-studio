import { profiles } from "./profiles.svelte"
import { py2js, js2py } from "$lib/utils/transpiler.js"


export class Param {

    val = $state();
    updates = $state();

    // is this param of a type which should be displayed as code
    isCodeType = $derived(![
        "extendedStr",
        "str", 
        "file", 
        "table",
        "color",
    ].includes(this.valType))
    // checks to see if this param looks like code
    isCode = $derived(
        this.isCodeType || String(this.val).startsWith("$")
    );

    // list of validators to run through (in order), these are added by param ctrls
    validators = $state({});
    // state keeping track of the valid state of this param
    valid = $derived.by(() => {
        // have to query this.val for the valid derived to update when this.val does
        // (this is dumb but I can't think of a better way to do it)
        let track = (val => val);
        track(this.val);
        // start off true with no warning
        let output = {
            value: true,
            warning: undefined
        };
        // iterate through validators
        for (let validator of Object.values(this.validators).sort(
            (x, y) => y.priority - x.priority
        )) {
            try {
                // run validation
                validator.validate(this, output);
            } catch (err) {
                return {
                    value: false,
                    warning: "Error validating parameter"
                };
            }
        }

        return output;
    });

    // when set to True, this param is deleted when OK is pressed on a Param dialog
    deleted = $state(false);

    // attributes which are saved to XML/JSON
    saveAttrs = [
        "name",
        "val",
        "valType",
        "updates",
        "plugin"
    ];

    constructor(name) {
        this.name = name;
        this.categ = undefined;
        this.allowedVals = undefined;
        this.valType = undefined;
        this.inputType = undefined;
        this.allowedUpdates = undefined;
        this.label = undefined;
        this.hint = undefined;
        this.plugin = undefined;
        this.depends = {
            shown: [],
            enabled: []
        };
        this.siblings = {};
    }

    /**
     *
     * @param {string} name Name to register this validator as
     * @param {function} validator Validation method - use `this` to refer to the param
     * @param {number} priority Higher priority validators are run first
     */
    registerValidator(name, validator, priority = 0) {
        this.validators[name] = {
            name: name,
            validate: validator,
            priority: priority
        };
    }

    /**
     * @returns {HTMLElement} This Param as an XML node
     */
    toXML() {
        // create document
        let doc = document.implementation.createDocument(null, "xml");
        // create node
        let node = doc.createElement("Param");
        // populate node
        for (let key of this.saveAttrs) {
            // take a snapshot
            let val = $state.snapshot(this[key]);
            // make Python compatable
            val = js2py(val);
            // set value
            node.setAttribute(key, val);
        }

        return node;
    }

    /**
     * Set this Param's values from a JSON object
     *
     * @param {HTMLElement} node This Param as an XML node
     */
    fromXML(node) {
        // populate
        for (let key of this.saveAttrs) {
            // only set value if it exists in node
            if (node.hasAttribute(key)) {
                // get value
                let val = node.getAttribute(key);
                // convert to JS
                val = py2js(val);
                // set
                this[key] = val;
            }
        }
    }

    /**
     * @returns {object} This Param as a JSON object
     */
    toJSON() {
        // create node
        let node = {};
        // populate node
        for (let key of this.saveAttrs) {
            node[key] = $state.snapshot(js2py(this[key]));
        }

        return node;
    }

    /**
     * Set this Param's values from a JSON object
     *
     * @param {object} node This Param as a JSON object
     */
    fromJSON(node) {
        // populate
        for (let key of this.saveAttrs) {
            // set from JSON if possible
            if (key in node) {
                this[key] = py2js(node[key]);
            }
        }
    }

    /**
     * @param {String} name Name of the param to create
     *
     * @returns {Param} An unknown param
     */
    static makeUnknown(name) {
        // make param
        let param = new Param(name);
        // populate with standard unknown loadout
        Object.assign(param, {
            val: undefined,
            categ: "Unknown",
            allowedVals: undefined,
            valType: undefined,
            inputType: "inv",
            updates: undefined,
            allowedUpdates: undefined,
            label: name,
            hint: "Parameter not recognised",
            plugin: undefined
        });

        return param;
    }

    copy() {
        // create new param
        let dupe = new Param(this.name);
        // set attributes
        for (let key of Object.keys(this)) {
            dupe[key] = this[key];
        }

        return dupe;
    }
}
export class HasParams {

    /** @attribute @type {String} Tag describing what kind of element this is (e.g. ImageComponent) */
    tag = undefined;

    /** @attribute @type {String|undefined} Name of the plugin (if any) which this element comes from */
    plugin = undefined;

    /** @attribute @type {Experiment} Experiment this element belongs to */
    exp = undefined;

    /** @attribute @type {Array} Names of known legacy params to ignore */
    legacyParams = [];

    /**
     * Array of parameters for this element
     */
    params = $state({});

    /**
     * Name of this element
     */
    name = $derived.by(() => {
        if ("name" in this.params) {
            return this.params['name'].val;
        } else if (this.tag === "SettingsComponent") {
            return "Experiment";
        } else if (this.tag === "Preferences") {
            return this.tag;
        }
    });

    /**
     * Whether this element is disabled
     */
    disabled = $derived(this.params['disabled'] && [true, "true", "True"].includes(this.params['disabled'].val));

    /**
     * This object's parameters, sorted by category
     */
    sortedParams = $derived.by(() => {
        // blank object
        let sorted = {
            uncategorised: {}
        };
        // iterate through params
        for (let [name, param] of Object.entries(this.params)) {
            // if no categ, put in uncategorised
            if (param.categ === null) {
                sorted.uncategorised[name] = param;
                continue;
            }
            // make sure we have an entry for this categ
            if (!(param.categ in sorted)) {
                sorted[param.categ] = {};
            }
            // add param
            sorted[param.categ][name] = param;
        }

        return sorted;
    });

    /**
     * Parameters relating to this element's start time
     */
    startParams = $derived({
        valueParam: this.params["startVal"],
        typeParam: this.params["startType"],
        expectedParam: this.params["startEstim"],
    });

    /**
     * Parameters relating to this element's stop time
     */
    stopParams = $derived.by(() => {
        // start off with no params
        let found = {
            valueParam: null,
            typeParam: null,
            expectedParam: null,
        };
        // get whatever params we can
        if ("stopVal" in this.params) {
            found.valueParam = this.params["stopVal"];
        }
        if ("stopType" in this.params) {
            found.typeParam = this.params["stopType"];
        }
        if ("durationEstim" in this.params) {
            found.expectedParam = this.params["durationEstim"];
        }

        return found;
    });

    constructor(tag) {
        // store tag
        this.tag = tag === "Settings" ? "SettingsComponent" : tag;
        // start off blank
        this.reset();
    }

    restore = {
        point: undefined,
        set: () => {
            // update history
            if (this.exp) {
                this.exp.history.update(`edit ${this.name}`);
            }
            // set restore point
            this.restore.point = this.toJSON();
        },
        apply: () => {
            // restore backup to clear changes
            this.fromJSON(this.restore.point);
            // remove last entry from experiment history
            if (this.exp) {
                this.exp.history.past.pop();
            }
        }
    };

    /**
     * Reset this elements parameters to a template
     */
    reset() {
        // get template
        let template;
        if (this.tag in profiles.components) {
            template = profiles.components[this.tag];
        } else if (this.tag in profiles.loops) {
            template = profiles.loops[this.tag];
        } else if (this.tag in profiles.devices) {
            template = profiles.devices[this.tag];
        } else if (this.tag === "Preferences") {
            template = profiles.preferences;
        } else {
            console.warn(
                `Failed to find template for ${this.tag}, reverting to UnknownComponent`
            );
            template = profiles.components["UnknownComponent"];
        }
        // set class
        this.__class__ = template?.__class__;
        // set icon
        this.iconSVG = template.iconSVG || template.iconFile;
        // set plugin
        this.plugin = template.plugin;
        // set help link
        this.helpLink = template.helpLink;
        // set legacy params
        this.legacyParams = template.legacyParams || [];
        // clear params
        Object.keys(this.params).forEach((key) => delete this.params[key]);
        // iterate through params in relevant template
        for (let [name, profile] of Object.entries(
            template.params || {}
        )) {
            // create a new param from template
            this.params[name] = new Param(name);
            // store ref to sibling params
            this.params[name].siblings = this.params;
            // set attributes
            for (let [key, val] of Object.entries(profile)) {
                this.params[name][key] = val;
            }
        }
    }

    /**
     * Make a copy of this element's parameters
     */
    copyParams() {
        return $state.snapshot(this.params);
    }

    /**
     * Removed any params queued for deletion
     */
    trim() {
        Object.keys(this.params).filter(
            // target only params which are marked deleted
            key => this.params[key].deleted
        ).forEach(
            // delete param
            key => delete this.params[key]
        );
    }

    /**
     * Search this element for a particular phrase
     */
    search(searchTerm, useRegex = false, caseSensitive = false) {
        let results = [];

        for (let param of Object.values(this.params)) {
            // always look in param val
            let targets = [
                $state.snapshot(param.val)
            ];
            // look in updates too if it's "set during:"
            if (String(param.updates).includes("set during:")) {
                targets.push(
                    $state.snapshot(param.updates)
                );
            }
            for (let val of targets) {
                // convert val and term to string
                val = String(val)
                let original = String(val)
                searchTerm = String(searchTerm)
                // if ignoring case, convert val and term to lowercase
                if (!caseSensitive) {
                    val = val.toLowerCase();
                    searchTerm = searchTerm.toLowerCase();
                }
                // placeholders for match details
                let found = {
                    got: false,
                    index: undefined,
                    text: undefined
                };
                // use different method if using regex...
                if (useRegex) {
                    // do a regex match
                    let reMatch = val.match(searchTerm);
                    // if found, get indices and string
                    if (reMatch) {
                        found.got = true;
                        found.index = reMatch.index;
                        found.text = reMatch[0];
                    }
                } else {
                    // do a simple string match
                    if (val.includes(searchTerm)) {
                        // if found, store text and index
                        found.got = true;
                        found.index = val.indexOf(searchTerm);
                        found.text = searchTerm;
                    }
                }
                // construct match object if found
                if (found.got) {
                    // store information on text found
                    let match = {
                        breadcrumbs: {},
                        text: {
                            before: original.slice(0, found.index),
                            text: original.slice(found.index, found.index + found.text.length),
                            after: original.slice(found.index + found.text.length)
                        }
                    };
                    // add breadcrumbs
                    if (this.constructor.name === "Component") {
                        match.breadcrumbs = {
                            param: param,
                            component: this,
                            routine: this.routine
                        };
                    } else if (this.constructor.name === "StandaloneRoutine") {
                        match.breadcrumbs = {
                            param: param,
                            routine: this
                        };
                    } else if (this.constructor.name === "LoopInitiator") {
                        match.breadcrumbs = {
                            param: param,
                            loop: this
                        };
                    }
                    // add to results
                    results.push(match);
                }
            }
        }

        return results;
    }

    /**
     * @returns {HTMLElement} XML node representing this element
     */
    toXML() {
        // create document
        let doc = document.implementation.createDocument(null, "xml");
        // create node
        let node = doc.createElement(
            this.tag === "SettingsComponent" ? "Settings" : this.tag
        );
        // set name and plugin
        node.setAttribute("name", this.name);
        node.setAttribute("plugin", js2py(this.plugin));
        // add params
        for (let param of Object.values(this.params)) {
            node.appendChild(
                param.toXML()
            );
        }

        return node;
    }

    /**
     * Populate this element from an XML node
     *
     * @param {Object} node JSON object representing this element
     */
    fromXML(node) {
        // set plugin and tag from node
        this.tag = node.nodeName === "Settings" ? "SettingsComponent" : node.nodeName;
        this.plugin = py2js(node.getAttribute("plugin"));
        // iterate through param nodes
        for (let paramNode of node.getElementsByTagName("Param")) {
            // param name
            let name = paramNode.getAttribute("name");
            // if param wasn't templated, make an unknown
            if (!(name in this.params)) {
                this.params[name] = Param.makeUnknown(name);
            }
            // populate param from XML
            this.params[name].fromXML(paramNode);
            // store ref to sibling params
            this.params[name].siblings = this.params;
        }
    }

    /**
     * @returns JSON object representing this element
     */
    toJSON() {
        // make node with basic attributes
        let node = {
            tag: this.tag,
            plugin: this.plugin,
            __class__: this.__class__,
            params: {}
        };
        // add params
        for (let [name, param] of Object.entries(this.params)) {
            node.params[name] = param.toJSON();
        }

        return node;
    }

    /**
     * Populate this element from a JSON object
     *
     * @param {Object} node JSON object representing this element
     */
    fromJSON(node) {
        // set plugin and tag
        this.tag = node.tag;
        this.plugin = node.plugin;
        // reset defaults
        this.reset();
        // iterate through param nodes
        for (let [name, paramNode] of Object.entries(node.params)) {
            // ignore legqacy params
            if (this.legacyParams.includes(name)) {
                continue;
            }
            // if param wasn't templated, make an unknown
            if (!(name in this.params)) {
                this.params[name] = Param.makeUnknown(name);
            }
            // populate param from JSON
            this.params[name].fromJSON(paramNode);
            // store ref to sibling params
            this.params[name].siblings = this.params;
        }
    }
}

