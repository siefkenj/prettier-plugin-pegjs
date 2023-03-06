import PegParser from "../grammars/pegjs.pegjs";

/**
 * Returns a copy of the AST without the `.loc` properties.
 * This makes the data structure smaller and easier to analyze
 * when printed with console.log
 *
 * @export
 * @param {object} ast
 * @param {boolean} stripComments - whether to filter out comments as well
 * @returns {object}
 */
export function stripLocInformation(ast, stripComments = true) {
    if (!ast) {
        return ast;
    }
    if (Array.isArray(ast)) {
        return ast.map((x) => stripLocInformation(x, stripComments));
    }
    if (typeof ast === "object") {
        const ret = {};
        for (const [key, val] of Object.entries(ast)) {
            if (key === "loc" || (stripComments && key === "comments")) {
                continue;
            }
            ret[key] = stripLocInformation(val, stripComments);
        }
        return ret;
    }
    return ast;
}

export function parse(src) {
    let ast = PegParser.parse(src);
    return ast;
}
