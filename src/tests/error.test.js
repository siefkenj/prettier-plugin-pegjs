import util from "util";

import * as pegjsParser from "../libs/parser";
import { printPrettier } from "../standalone";

/* eslint-env jest */

// Make console.log pretty-print by default
export const origLog = console.log;
console.log = (...args) => {
    origLog(...args.map((x) => util.inspect(x, false, 10, true)));
};

describe("Test grammars with errors", () => {
    it("Fails on invalid PEG grammar", () => {
        expect(() => pegjsParser.parse('a \n = "a')).toThrow();
    });

    it("Succeeds on invalid javascript", () => {
        expect(() => pegjsParser.parse('a \n = "a" {const 7}')).not.toThrow();
    });

    it("Invalid javascript is left unformatted", async () => {
        const origWarn = console.warn;
        let warnings = 0;
        // Mock `console.warn` so that its output doesn't clutter up the test output
        global.console.warn = () => {
            ++warnings;
        };
        expect(
            async () => await printPrettier('a \n = "a" { const 7}')
        ).not.toThrow();
        expect(await printPrettier('a \n = "a" { const 7}')).toEqual(
            'a = "a" { const 7}\n'
        );
        expect(warnings).toEqual(2);

        global.console.warn = origWarn;
    });
});
