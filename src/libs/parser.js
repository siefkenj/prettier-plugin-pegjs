import PegParser from "../grammars/pegjs.pegjs";

export function parse(src) {
    let ast = PegParser.parse(src);
    return ast;
}
