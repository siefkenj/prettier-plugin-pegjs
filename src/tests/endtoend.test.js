import util from "util";
import fs from "fs/promises";
import path from "path";
import * as peggy from "peggy";
import { printPrettier } from "../standalone";
import Prettier from "prettier";

/* eslint-env jest */
/* global __dirname */

// Make console.log pretty-print by default
export const origLog = console.log;
console.log = (...args) => {
    origLog(...args.map((x) => util.inspect(x, false, 10, true)));
};

describe("End to end", () => {
    //
    // We compile a grammar with Pegjs, then pretty print it and compile it
    // again and make sure the results match. Since the pretty printing shouldn't
    // change the AST, the results should always match.
    //
    // Dynamically generate tests for each of the listed files.
    for (const file of [
        "arithmetic.pegjs",
        "pegjs-modified.pegjs",
        "javascript.pegjs",
        "latex.pegjs",
        "json.pegjs",
        "css.pegjs",
    ]) {
        it(`Doesn't change the grammar of ${file}`, async () => {
            const originalGrammar = (
                await fs.readFile(path.join(__dirname, "./grammars/", file))
            ).toString();
            const prettyGrammar = await printPrettier(originalGrammar);

            let originalParser = peggy.generate(originalGrammar, {
                output: "source",
            });
            let prettyParser = peggy.generate(prettyGrammar, {
                output: "source",
            });

            // We run the parsers through prettier again to normalize the output
            originalParser = Prettier.format(originalParser, {
                parser: "babel",
            });
            prettyParser = Prettier.format(prettyParser, { parser: "babel" });

            expect(originalParser).toEqual(prettyParser);
        });
        it(`Doesn't change formatting of ${file}`, async () => {
            const originalGrammar = (
                await fs.readFile(path.join(__dirname, "./grammars/", file))
            ).toString();
            const prettyGrammar = await printPrettier(originalGrammar);

            expect(prettyGrammar).toEqual(originalGrammar);
        });
    }
});
