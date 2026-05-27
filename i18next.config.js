/**
 * This defines the configuration for `i18next-cli extract`, which can be used to scan PsychoPy 
 * Studio's code for strings which need to have a translation defined.
 */
import { parse } from "svelte/compiler";
import { walk } from "estree-walker";

let functions = ["t", "i18next.t", "translate"]

const SvelteExtractor = {
  name: "svelte-extractor",
  onLoad: (code, path) => {
    // ignore non-Svelte files
    if (!path.endsWith(".svelte")) {
      return undefined
    }
    // parse file
    let ast = parse(code, {
      filename: path 
    });
    // array in which to store output
    let extracted = [];
    // extract from instance
    if (ast.instance) {
      extracted.push(
        code.slice(
          ast.instance.content.start, ast.instance.content.end
        )
      )
    }
    // extract from module
    if (ast.module) {
      extracted.push(
        code.slice(
          ast.module.content.start, ast.module.content.end
        )
      )
    }
    // extract from html
    if (ast.html) {
      walk(ast.html, {
        enter(node, parent, prop, index) {
          // we're only interested in mustage tags
          if (node?.type !== "MustacheTag") {
            return
          }
          // add content to extracted array
          extracted.push("(" + code.slice(
            node.expression.start, node.expression.end
          ) + ")")
        }
      })
    }
    
    return extracted.join("\n")
  }
}


/** @type {import('i18next-cli').I18nextToolkitConfig} */
export default {
  locales: [
    "ar-001",
    "cs-CZ",
    "da-DK",
    "de-DE",
    "el-GR",
    "en-NZ",
    "en-US",
    "es-CO",
    "es-ES",
    "es-US",
    "et-EE",
    "fa-IR",
    "fi-FI",
    "fr-FR",
    "he-IL",
    "hi-IN",
    "hu-HU",
    "it-IT",
    "ja-JP",
    "ko-KR",
    "ms-MY",
    "nl-NL",
    "nn-NO",
    "pl-PL",
    "pt-PT",
    "ro-RO",
    "ru-RU",
    "sv-SE",
    "tr-TR",
    "zh-CN",
    "zh-TW",
  ],
  
  extract: {
    input: ["src/**/*.{svelte,js,svelte.js}"],
    output: "src/lib/translation/locales/{{language}}.json",
    primaryLanguage: "en-US",
    removeUnusedKeys: false,
    defaultValue: undefined,
    defaultNS: false,
    functions: functions
  },
  
  plugins: [
    SvelteExtractor
  ]
}