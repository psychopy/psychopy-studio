import { HasParams } from "./param.svelte";


export class Device extends HasParams {
    constructor(tag, profile) {
        super(tag);
        this.profile = profile;
    }

    reset() {
        // reset as normal
        super.reset()
        // add device profile items to param siblings
        for (let param of Object.values(this.params)) {
            Object.assign(param.context, this.profile)
        }
    }

    /**
     * @returns JSON object representing this element
     */
    toJSON() {
        // do usual toJSON
        let output = super.toJSON();
        // add cls and profile
        output.profile = this.profile;

        return output;
    }

    /**
     * Populate this element from a JSON object
     *
     * @param {Object} node JSON object representing this element
     */
    fromJSON(node) {
        // do usual fromJSON
        super.fromJSON(node);
        // get cls and profile
        this.__cls__ = node.__cls__;
        this.profile = node.profile;
    }
}
