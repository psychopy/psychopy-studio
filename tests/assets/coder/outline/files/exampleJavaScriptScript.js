/**
 * Example JavaScript script for testing the Coder outline panel.
 */
import { something } from "./somewhere.js";


const GRAVITY = 9.81;
let uninitialised;
const { firstKey, secondKey } = something;


function topLevelFunction(someArg, someKwarg = "someKwarg") {
    // variable inside a function
    let localVariable = someArg;
    // function nested inside a function
    function nestedHelper(value) {
        // function nested two levels deep
        function deeplyNestedHelper(other) {
            return value + other;
        }

        return deeplyNestedHelper(1);
    }

    return nestedHelper(localVariable);
}


async function asyncFunction() {
    return await something();
}


const arrowFunction = (value) => {
    return value * 2;
};


class SomeParentClass {
    constructor(someArg) {
        this.someArg = someArg;
    }

    someMethod() {
        return this.someArg;
    }
}


class SomeChildClass extends SomeParentClass {
    constructor(someArg, someOtherArg) {
        super(someArg);
        this.someOtherArg = someOtherArg;
    }
}


if (GRAVITY > 0) {
    function conditionallyDefinedFunction() {
        return GRAVITY;
    }
}
