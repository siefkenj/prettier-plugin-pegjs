// This file needs to be here because typescript does not know how to use babel's transpiler
// to directly load Pegjs grammars.
// @ts-nocheck
import * as _PeggyParser from "../grammars/pegjs.peggy";
import { Grammar } from "./types";

type PeggyParser = {
    parse: (input: string) => Grammar;
    SyntaxError: (
        message: string,
        expected: string,
        found: unknown,
        location: unknown
    ) => unknown;
};

const PeggyParser = _PeggyParser as PeggyParser;
const parse = PeggyParser.parse;

export { PeggyParser, parse };
