//
// This file contains a standalone parser which includes Prettier
//
import * as Prettier from "prettier/standalone";
import * as prettierPluginPegjs from "./prettier-plugin-pegjs";

// Because we're importing the standalone version of prettier, we also have
// to import the specific plugins we want

import * as babelPlugin from "prettier/plugins/babel";
import * as estreePlugin from "prettier/plugins/estree";
import { parsers as _ } from "prettier/plugins/babel";
import type { Options, Plugin } from "prettier";

/**
 * Format `source` code using Prettier to format/render
 * the code.
 *
 * @export
 * @param [source=""] - code to be formatted
 * @param [options={}] - Prettier options object (you can set `printWidth` here)
 * @returns formatted code
 */
async function printPrettier(
    source = "",
    options: Options & { actionParser?: string } = {}
) {
    // Load the prettier and babel plugins, but also allow
    // other plugins to be passed in.
    const plugins = options.plugins || [];
    plugins.push(prettierPluginPegjs, babelPlugin, estreePlugin); //, estreePlugin);

    return await Prettier.format(source, {
        printWidth: 80,
        useTabs: false,
        tabWidth: 2,
        ...options,
        parser: "pegjs-parser",
        plugins,
    });
}

export { Prettier, printPrettier, prettierPluginPegjs };
