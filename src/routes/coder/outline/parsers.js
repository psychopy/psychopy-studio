import { parser as pythonParser } from "@lezer/python";
import { parser as jsParser } from "@lezer/javascript";
import { parser as mdParser } from "@lezer/markdown";


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


/**
 * Parse JavaScript content into a flat list of the definitions it contains
 *
 * @param {string} content JavaScript code to parse
 * @param {number} index Character index of this content in the file
 * @param {string} parentType Type of the node this content is the body of, if any (class bodies
 * aren't valid JavaScript on their own, so need to be parsed in the context of a class)
 */
export function parseJavaScript(content, index=1, parentType=undefined) {
    let subnodes = [];
    // class bodies only parse correctly inside a class, so wrap them in a dummy one
    let wrapper = parentType === "ClassDeclaration" ? "class _ " : ""
    let src = wrapper + content
    // parse JavaScript
    let node = jsParser.parse(src)
    // iterate through subnodes
    node.iterate({
        enter: subnode => {
            // skip the dummy class wrapper (but not its body)
            if (subnode.from < wrapper.length) {
                return true
            }
            // for function and class defs...
            if (["FunctionDeclaration", "ClassDeclaration"].includes(subnode.type.name)) {
                // get name and content
                let namenode = subnode.node.getChild("VariableDefinition")
                let bodynode = subnode.node.getChild("Block") || subnode.node.getChild("ClassBody")
                // append details
                subnodes.push({
                    content: src.slice(bodynode.from, bodynode.to),
                    index: index + subnode.from - wrapper.length,
                    type: subnode.type.name,
                    name: src.slice(namenode.from, namenode.to),
                })
                // stop iteration
                return false
            }
            // for class methods...
            if (subnode.type.name === "MethodDeclaration") {
                // get name and content
                let namenode = subnode.node.getChild("PropertyDefinition") || subnode.node.getChild("PrivatePropertyDefinition")
                let bodynode = subnode.node.getChild("Block")
                // append details
                subnodes.push({
                    content: src.slice(bodynode.from, bodynode.to),
                    index: index + subnode.from - wrapper.length,
                    type: subnode.type.name,
                    name: src.slice(namenode.from, namenode.to),
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
                    content: bodynode ? src.slice(bodynode.from, bodynode.to) : "undefined",
                    index: 1 + index + subnode.from - wrapper.length,
                    type: subnode.type.name,
                    name: src.slice(namenode.from, namenode.to),
                })
                // stop iteration
                return false
                
            }
        }
    })

    return subnodes
}


export function parseMarkdown(content, index=1) {
    let subnodes = [];
    // parse Markdown
    let node = mdParser.parse(content)
    // this allows us to skip to a given node in the iterator
    let skipTo = undefined
    // iterate through subnodes
    node.iterate({
        enter: subnode => {
            // are we skipping to a given node?
            if (skipTo !== undefined && subnode.from < skipTo) {
                return false
            }
            // get coords of this node
            let i = [subnode.from, subnode.to]
            // for headings...
            if ([
                "SetextHeading1", "ATXHeading1",
                "SetextHeading2", "ATXHeading2", 
                "ATXHeading3",
                "ATXHeading4", 
                "ATXHeading5", 
                "ATXHeading6"
            ].includes(subnode.type.name)) {
                // strip the header mark
                for (let mark of subnode.node.getChildren("HeaderMark")) {
                    if (subnode.type.name.startsWith("Setext")) {
                        i[1] = mark.from
                    } else {
                        i[0] = mark.to
                    }
                }
                // get heading level
                let level = parseInt(subnode.type.name.at(-1))
                // get extent of headed content (up to the next heading of the same or higher level, or the end)
                let end = content.length
                for (let next = subnode.node.nextSibling; next; next = next.nextSibling) {
                    if (next.type.name.match(/Heading\d$/) && parseInt(next.type.name.at(-1)) <= level) {
                        end = next.from
                        break
                    }
                }
                // append details
                subnodes.push({
                    content: content.slice(subnode.to, end),
                    index: index + subnode.to,
                    type: subnode.type.name,
                    name: content.slice(...i).trim(),
                })
                // skip the headed content (it's handled by the recursion)
                skipTo = end
                // stop iteration
                return false
            }
        }
    })

    return subnodes
}
