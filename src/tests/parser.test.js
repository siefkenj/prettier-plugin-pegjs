import util from "util";

import * as pegjsParser from "../libs/parser";

/* eslint-env jest */

// Make console.log pretty-print by default
export const origLog = console.log;
console.log = (...args) => {
    origLog(...args.map((x) => util.inspect(x, false, 10, true)));
};

describe("Basic parse", () => {
    it("Parses trivial grammar", () => {
        pegjsParser.parse('a = "a"');
        pegjsParser.parse('a \n = "a"');
        pegjsParser.parse('a = \n"a"');
        pegjsParser.parse('a = "a" / "b"');
    });

    it("Parses simple grammars from pegjs test suite", () => {
        const grammars = [
            "start = (a:'a') &{ return a === 'a'; }",
            "start = (a:'a')? &{ return a === 'a'; }",
            "start = (a:'a')* &{ return a === 'a'; }",
            "start = (a:'a')+ &{ return a === 'a'; }",
            "start = $(a:'a') &{ return a === 'a'; }",
            "start = &(a:'a') 'a' &{ return a === 'a'; }",
            "start = !(a:'a') 'b' &{ return a === 'a'; }",
            "start = b:(a:'a') &{ return a === 'a'; }",
            "start = ('a' b:'b' 'c') &{ return b === 'b'; }",
            "start = (a:'a' { return a; }) &{ return a === 'a'; }",
            "start = ('a' / b:'b' / 'c') &{ return b === 'b'; }",
            "start = (a:'a') !{ return a !== 'a'; }",
            "start = (a:'a')? !{ return a !== 'a'; }",
            "start = (a:'a')* !{ return a !== 'a'; }",
            "start = (a:'a')+ !{ return a !== 'a'; }",
            "start = $(a:'a') !{ return a !== 'a'; }",
            "start = &(a:'a') 'a' !{ return a !== 'a'; }",
            "start = !(a:'a') 'b' !{ return a !== 'a'; }",
            "start = b:(a:'a') !{ return a !== 'a'; }",
            "start = ('a' b:'b' 'c') !{ return b !== 'b'; }",
            "start = (a:'a' { return a; }) !{ return a !== 'a'; }",
            "start = ('a' / b:'b' / 'c') !{ return b !== 'b'; }",
            "start = (a:'a') { return a; }",
            "start = (a:'a')? { return a; }",
            "start = (a:'a')* { return a; }",
            "start = (a:'a')+ { return a; }",
            "start = $(a:'a') { return a; }",
            "start = &(a:'a') 'a' { return a; }",
            "start = !(a:'a') 'b' { return a; }",
            "start = b:(a:'a') { return a; }",
            "start = ('a' b:'b' 'c') { return b; }",
            "start = (a:'a' { return a; }) { return a; }",
            "start = ('a' / b:'b' / 'c') { return b; }",
            // Typescript action
            "start = ('a' / b:'b' / 'c') { return b as string; }",
        ];

        for (const grammar of grammars) {
            pegjsParser.parse(grammar);
        }
    });
});
