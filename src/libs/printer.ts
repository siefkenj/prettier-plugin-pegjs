import type { AstPath, Printer } from "prettier";
import { util } from "prettier";
import { builders, utils } from "prettier/doc";
import { AstNode, Comment } from "../types";

type Doc = builders.Doc;
type PrinterPrint = Printer<AstNode | null | undefined>["print"];
type PrinterEmbed = NonNullable<Printer<AstNode>["embed"]>;
type PrinterComment = NonNullable<Printer<AstNode>["printComment"]>;

// Commands to build the prettier syntax tree
const {
    group,
    //fill,
    //ifBreak,
    line,
    softline,
    hardline,
    //lineSuffix,
    //lineSuffixBoundary,
    indent,
    join,
    //markAsRoot,
    breakParent,
} = builders;

function wrapInParenGroup(doc: Doc): Doc {
    return group(["(", indent([softline, doc]), softline, ")"]);
}

const SEMANTIC_SUFFIX_MAP = {
    semantic_and: "&",
    semantic_not: "!",
} as const;

const PREFIX_MAP = {
    text: "$",
    simple_and: "&",
    simple_not: "!",
} as const;

const SUFFIX_MAP = {
    optional: "?",
    zero_or_more: "*",
    one_or_more: "+",
    repeated: "|..|",
} as const;

function isPrefixOperator(node: AstNode) {
    return node.type in PREFIX_MAP;
}

function isSuffixOperator(node: AstNode) {
    return node.type in SUFFIX_MAP;
}

function hasCodeBlock(node: AstNode) {
    return [
        "action",
        "semantic_and",
        "semantic_not",
        "initializer",
        "ginitializer",
        "function",
    ].includes(node.type);
}

/**
 * Returns true if `node.expression` should be wrapped in
 * parens to avoid potential confusion (e.g., because
 * the reader has forgotten the precedence of operations)
 *
 * @param {*} node
 */
function nodeExpressionNeedsWrapping(node: AstNode) {
    if (!("expression" in node) || !node.expression) {
        return false;
    }
    // Most of the time we want to wrap expressions like `&foo?` in
    // parenthesis like `&(foo?)`. The exceptions are `$foo*`, etc., whose meaning
    // should be clear
    if (
        isPrefixOperator(node) &&
        node.type !== "text" &&
        isSuffixOperator(node.expression)
    ) {
        return true;
    }
    if (node.type === "labeled" && isSuffixOperator(node.expression)) {
        // Suffix operators will wrap their arguments in parenthesis if needed
        // so we don't need to wrap them in another set
        return false;
    }
    // A suffix operator with a prefix/suffix operator child must have parens.
    // E.g. `($"x"+)?` otherwise there may be two suffix operators that appear in a row!
    if (
        isSuffixOperator(node) &&
        (isPrefixOperator(node.expression) || isSuffixOperator(node.expression))
    ) {
        return true;
    }
    // Normally `labeled` expressions are wrapped in parens, but
    // if they are part of a choice, we don't want them wrapped.
    // For example `a:Rule {return a}` should *not* become
    // `(a:Rule) {return a}`.
    if (node.type === "action" && node.expression.type === "labeled") {
        return false;
    }
    if (["choice", "labeled", "action"].includes(node.expression.type)) {
        return true;
    }
    return false;
}

// The signature of this function is determined by the Prettier
// plugin API.
export const printPegjsAst: PrinterPrint = (path, options, print) => {
    const node = path.node;
    if (!node) {
        console.warn("Got `undefined` node while printing");
        return "";
    }

    const type = node.type;
    switch (type) {
        case "grammar": {
            // This is the root node of a Pegjs grammar
            // A `hardline` is inserted at the end so that any trailing comments
            // are printed
            const body: Doc[] = [
                join([hardline, hardline], path.map(print, "rules")),
                hardline,
            ];

            if (node.initializer) {
                body.unshift(
                    path.call(print, "initializer"),
                    hardline,
                    hardline,
                );
            }

            if (node.ginitializer) {
                body.unshift(
                    path.call(print, "ginitializer"),
                    hardline,
                    hardline,
                );
            }

            return body;
        }
        case "rule": {
            const lhs: Doc[] = [node.name];
            if (node.displayName) {
                lhs.push(" ", path.call(print, "displayName"));
            }

            const rhs = [
                line,
                path.call(print, "delimiter"),
                " ",
                path.call(print, "expression"),
            ];
            return group(lhs.concat(indent(rhs)));
        }
        case "rule_ref":
            return node.name;

        // This is a string a quoted string. E.g., literally `"abc"`
        case "stringliteral":
            return util.makeString(node.value, '"');

        case "delimiter":
            return node.value;

        case "any":
            return ".";

        case "choice": {
            const rhs = path.map(print, "alternatives");
            if (rhs.length === 0) {
                return "";
            }
            // Delimiters (i.e., "/") are theoretically all the same,
            // but they may have comments surrounding them. To preserve these
            // comments, we actually print them.
            const delimiters = path.map(print, "delimiters");

            const body = [rhs[0]];
            for (let i = 0; i < delimiters.length; i++) {
                body.push(line, delimiters[i], " ", rhs[i + 1]);
            }

            const parent = path.getParentNode();
            if (parent && parent.type === "rule") {
                // Rules are the top-level objects of a grammar. If we are the child
                // of a rule, we want to line-break no matter what.
                body.push(breakParent);
            }

            return body;
        }
        case "literal":
            if (node.ignoreCase) {
                return [util.makeString(node.value, '"'), "i"];
            }
            return util.makeString(node.value, '"');

        case "group":
            return wrapInParenGroup(path.call(print, "expression"));

        case "sequence": {
            let body = path.map(print, "elements");
            // Any `action` or `choice` that appears in a sequence needs to
            // be wrapped in parens.
            body = body.map((printed, i) => {
                const child = node.elements[i];
                if (["action", "choice"].includes(child.type)) {
                    return wrapInParenGroup(printed);
                }
                return printed;
            });
            return group(indent(join(line, body)));
        }

        case "labeled": {
            const label = node.label;
            let rhs = path.call(print, "expression");
            if (nodeExpressionNeedsWrapping(node)) {
                rhs = wrapInParenGroup(rhs);
            }
            let lhs = [];
            if (node.pick) {
                lhs.push("@");
            }
            if (label) {
                lhs.push(label, ":");
            }
            return [...lhs, rhs];
        }
        // suffix operators
        case "optional":
        case "zero_or_more":
        case "one_or_more": {
            const suffix = SUFFIX_MAP[node.type];
            const body = path.call(print, "expression");
            if (nodeExpressionNeedsWrapping(node)) {
                return [wrapInParenGroup(body), suffix];
            }
            return [body, suffix];
        }
        // prefix operators
        case "text":
        case "simple_and":
        case "simple_not": {
            const prefix = PREFIX_MAP[node.type];
            if (nodeExpressionNeedsWrapping(node)) {
                return [
                    prefix,
                    wrapInParenGroup(path.call(print, "expression")),
                ];
            }
            return [prefix, path.call(print, "expression")];
        }
        // Things in square brackets (e.g. `[a-zUVW]`)
        case "class": {
            const prefix = node.inverted ? "^" : "";
            const suffix = node.ignoreCase ? "i" : "";
            const lhs = node.parts.map((part) => {
                if (Array.isArray(part)) {
                    return part.join("-");
                }
                return part;
            });

            return ["[", prefix, ...lhs, "]", suffix];
        }
        case "repeated": {
            let body = path.call(print, "expression");
            if (nodeExpressionNeedsWrapping(node)) {
                body = wrapInParenGroup(body);
            }
            let min = node.min != null ? path.call(print, "min") : "";
            if (min === "0") {
                // A minimum value of zero is the same as not listing an explicit minimum at all.
                min = "";
            }
            const max = node.max != null ? path.call(print, "max") : "";
            let range: Doc[] = [min, "..", max];
            if (node.min == null) {
                range = [max];
            }
            if (node.min == null && node.max == null) {
                range = [".."];
            }
            let delim: Doc[] = [];
            if (node.delimiter) {
                delim.push(",", " ", path.call(print, "delimiter"));
            }
            return [body, "|", ...range, ...delim, "|"];
        }
        case "constant":
        case "variable":
            return node.value != null ? String(node.value) : "";

        case "function":
        case "initializer":
        case "ginitializer":
        case "action":
        case "comment":
        case "semantic_and":
        case "semantic_not":
            console.warn(
                `Encountered node of type "${type}"; this type of node should have been processed by its parent. If you're seeing this, please report an issue on Github.`,
            );
            return "";

        default: {
            const unmatchedType: void = type;
            console.warn(
                `Found node with unknown type '${unmatchedType}'`,
                JSON.stringify(node),
            );
        }
    }

    throw new Error(`Could not find printer for node ${JSON.stringify(node)}`);
};

/**
 * This is called by Prettier whenever a comment is to be printed.
 * Comments are stored outside of the AST, but Prettier will make its best guess
 * about which node a comment "belongs to". The return Doc of this function
 * is inserted in the appropriate place.
 *
 * @param {*} commentPath
 * @param {*} options
 */
export const printComment: PrinterComment = (commentPath) => {
    const comment = commentPath.node as Comment;

    if (comment.multiline) {
        return ["/*", comment.value, "*/"];
    }
    return ["//", comment.value];
};

/**
 * Used to print embedded javascript codeblocks. This function
 * is called on every node. If `null` is returned, the Pegjs
 * printer is used. Otherwise, `textToDoc` can be used to select a
 * different one.
 */
export const embed: PrinterEmbed = (path: AstPath<AstNode>, options) => {
    return async (textToDoc, print) => {
        const node = path.node;
        if (!hasCodeBlock(node)) {
            // Returning null tells Prettier to use the default printer
            // (in this case, the Pegjs printer)
            return undefined;
        }

        /**
         * Format code, and wrap it in `{ }` or `{{ }}`
         *
         * @param {string} code - text of the embedded code to format.
         * @param {boolean} double - whether to use single or double braces
         */
        async function wrapCode(code: string, double = false): Promise<Doc> {
            // By default, prettier will add a hardline at the end of a parsed document.
            // We don't want this hardline in embedded code.
            const parser = (options as any).actionParser || "babel-ts";
            try {
                const formatted = utils.stripTrailingHardline(
                    await textToDoc(code, { parser }),
                );
                return group([
                    double ? "{{" : "{",
                    indent([line, formatted]),
                    line,
                    double ? "}}" : "}",
                ]);
            } catch (e: any) {
                console.warn(
                    `Could not process the following code with the '${parser}' parser, so leaving unformatted. Code:`,
                    JSON.stringify(code),
                    `Error message:`,
                    e.message,
                );
                return [double ? "{{" : "{", code, double ? "}}" : "}"];
            }
        }

        let prefix, body;
        switch (node.type) {
            case "action":
                body = path.call(print, "expression");
                if (nodeExpressionNeedsWrapping(node)) {
                    body = wrapInParenGroup(body);
                }
                body = [body, indent([" ", await wrapCode(node.code)])];
                return body;
            case "semantic_and":
            case "semantic_not":
                prefix = SEMANTIC_SUFFIX_MAP[node.type];
                return [prefix, indent([" ", await wrapCode(node.code)])];
            case "function":
                return wrapCode(node.value);
            case "initializer":
                return wrapCode(node.code);
            case "ginitializer":
                return wrapCode(node.code, true);
            default:
                return undefined;
        }
    };
};
