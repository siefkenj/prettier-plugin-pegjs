import util from "util";

import { printPrettier } from "../standalone";

/* eslint-env jest */

// Make console.log pretty-print by default
export const origLog = console.log;
console.log = (...args) => {
    origLog(...args.map((x) => util.inspect(x, false, 10, true)));
};

describe("Printer", () => {
    it("Prints grammars without actions", async () => {
        const sources = [
            "Rule = a/b/c",
            "Rule = a",
            "Rule = [a-zA-Z]",
            "Rule = a *",
            "Rule = (a/b)?",
            "Rule = (a/b/c)   ?",
            "Rule = (a/(b/c)+)   ?",
            "Rule = $(a/(b/c)+)   ?",
            "Rule = $(a/(b/c)+)   ?\n OtherRule= Rule & 'q'",
        ];

        for (const src of sources) {
            const formatted = await printPrettier(src, { printWidth: 80 });
            expect(formatted).toMatchSnapshot();
        }
    });
    it("Prints grammars with actions", async () => {
        const sources = [
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
        ];

        for (const src of sources) {
            const formatted = await printPrettier(src, { printWidth: 80 });
            expect(formatted).toMatchSnapshot();
        }
    });
    it("Prints grammars with initializer", async () => {
        const sources = [
            "{console.log('initializing')}; Rule = a/b/c",
            "{console.log('initializing')}\n\n Rule = a/b/c",
            "{{console.log('initializing global')}}\n\n Rule = a/b/c",
            "{{console.log('initializing global')}}; Rule = a/b/c",
            "{{console.log('initializing global')}}\n\n {console.log('initializing local')}\n\n Rule = a/b/c",
            "{{console.log('initializing global')}}; {console.log('initializing local')}; Rule = a/b/c",
        ];

        for (const src of sources) {
            const formatted = await printPrettier(src, { printWidth: 80 });
            expect(formatted).toMatchSnapshot();
        }
    });
    it("Prints grammars with comments", async () => {
        const sources = [
            "start = // a comment\n a / b",
            "start = a // a comment\n / b",
            "start = a \n// a comment\n / b",
            "start = a / \n// a comment\n  b",
            "// a comment\n start = a / b",
            "start /*inline comment*/= a / b",
            "start = a / /*inline comment*/ b",
            "start = a / x /*inline comment*/ b",
            'start /*inline comment*/ "Start Label"= a / b',
        ];

        for (const src of sources) {
            const formatted = await printPrettier(src, { printWidth: 80 });
            expect(formatted).toMatchSnapshot();
        }
    });
    it("Issue 18 nested optional concat", async () => {
        const sources = ['start = ($"x"+)?', 'start = $("x"+)?'];

        for (const src of sources) {
            const formatted = await printPrettier(src, { printWidth: 80 });
            expect(formatted).toMatchSnapshot();
        }
    });
    it("Print typescript action", async () => {
        const sources = ["start = 'a' {return 5 as any}"];

        for (const src of sources) {
            const formatted = await printPrettier(src, { printWidth: 80 });
            expect(formatted).toMatchSnapshot();
        }
    });
    it("Print repetition rules", async () => {
        const sources = [
            "start = 'a'| .. |",
            "start = 'a'|2 ..|",
            "start = 'a'|2 .. 5|",
            "start = 'a'| .. 5|",
            "start = 'a'|2 .. 5,'x'|",
            "start = 'a'| 5 |",
            "start = x:'a'| {return parseInt(x , 10)} |",
            "start = x:'a'| {return parseInt(x , 10)} .. 7 |",
        ];

        for (const src of sources) {
            const formatted = await printPrettier(src, { printWidth: 80 });
            expect(formatted).toMatchSnapshot();
        }
    });
    it("Print repetition with suffix operator", async () => {
        const sources = [
            "start = ('a'| .. |)?",
            "start = ('a'| .. |)|..|",
            "start = ('a' 'b')| .. |",
        ];

        for (const src of sources) {
            const formatted = await printPrettier(src, { printWidth: 80 });
            expect(formatted).toMatchSnapshot();
        }
    });
});
