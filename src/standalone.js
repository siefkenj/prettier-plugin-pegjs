//
// This file contains a standalone parser which includes Prettier
//
import Prettier from "prettier/standalone";
import * as prettierPluginPegjs from "./prettier-plugin-pegjs";

// Because we're importing the standalone version of prettier, we also have
// to import the specific plugins we want

import babelPlugin from "prettier/parser-babel";

/**
 * Format `source` LaTeX code using Prettier to format/render
 * the code.
 *
 * @export
 * @param {string} [source=""] - code to be formatted
 * @param {*} [options={}] - Prettier options object (you can set `printWidth` here)
 * @returns {string} formatted code
 */
function printPrettier(source = "", options = {}) {
    // Load the prettier and babel plugins, but also allow
    // other plugins to be passed in.
    const plugins = options.plugins || []
    plugins.push(prettierPluginPegjs, babelPlugin)

    return Prettier.format(source, {
        printWidth: 80,
        useTabs: false,
        tabWidth: 2,
        ...options,
        parser: "pegjs-parser",
        plugins,
    });
}

export { Prettier, printPrettier, prettierPluginPegjs };
