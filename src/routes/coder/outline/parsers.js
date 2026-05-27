import { parser as pythonParser } from "@lezer/python";
import { parser as jsParser } from "@lezer/javascript";


export function parsePython(content, index=1) {
    let subnodes = [];
    // parse Python
    let node = pythonParser.parse(content)
    // iterate through subnodes
    node.iterate({
        enter: subnode => {
            // for function and class defs...
            if (["FunctionDefinition", "ClassDefinition"].includes(subnode.type.name)) {
                // get name and content
                let namenode = subnode.node.getChild("VariableName")
                let bodynode = subnode.node.getChild("Body")
                // append details
                subnodes.push({
                    content: content.slice(bodynode.from, bodynode.to),
                    index: index + subnode.from,
                    type: subnode.type.name,
                    name: content.slice(namenode.from, namenode.to),
                })
                // stop iteration
                return false
            }
        }
    })

    return subnodes
}


export function parseJavaScript(content, index=1) {
    let subnodes = [];
    // parse JavaScript
    let node = jsParser.parse(content)
    // iterate through subnodes
    node.iterate({
        enter: subnode => {
            // for function and class defs...
            if (["FunctionDeclaration", "ClassDeclaration"].includes(subnode.type.name)) {
                // get name and content
                let namenode = subnode.node.getChild("VariableDefinition")
                let bodynode = subnode.node.getChild("Block")
                // append details
                subnodes.push({
                    content: content.slice(bodynode.from, bodynode.to),
                    index: index + subnode.from,
                    type: subnode.type.name,
                    name: content.slice(namenode.from, namenode.to),
                })
                // stop iteration
                return false
            }
            // for variable defs...
            if (subnode.type.name === "VariableDeclaration") {
                // get name
                let namenode = subnode.node.getChild("VariableDefinition") || subnode.node.getChild("ObjectPattern")
                let bodynode = subnode.node.getChild("Equals")

                // append details
                subnodes.push({
                    content: bodynode ? content.slice(bodynode.from, bodynode.to) : "undefined",
                    index: 1 + index + subnode.from,
                    type: subnode.type.name,
                    name: content.slice(namenode.from, namenode.to),
                })
                // stop iteration
                return false
                
            }
        }
    })

    return subnodes
}