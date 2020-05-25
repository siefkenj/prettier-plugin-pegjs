//import Prettier from "prettier/standalone";

// Cant do this import when doing the git-hosted version of prettier
//import { builders, utils } from "prettier/doc";
import prettier from "prettier";
import { parse } from "./libs/parser";
import { util } from "prettier";

const { builders, utils } = prettier.doc;

// Commands to build the prettier syntax tree
const {
    concat,
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
    //breakParent,
} = builders;

function wrapInParenGroup(doc) {
    return group(
        concat([
            "(",
            //indent(concat([indent(concat([softline, doc])), softline, ")"])),
            indent(concat([softline, doc])),
            softline,
            ")",
        ])
    );
}

const SEMANTIC_SUFFIX_MAP = {
    semantic_and: "&",
    semantic_not: "!",
};

const PREFIX_MAP = {
    text: "$",
    simple_and: "&",
    simple_not: "!",
};

const SUFFIX_MAP = {
    optional: "?",
    zero_or_more: "*",
    one_or_more: "+",
};

function isPrefixOperator(node) {
    return node.type in PREFIX_MAP;
}

function isSuffixOperator(node) {
    return node.type in SUFFIX_MAP;
}

function hasCodeBlock(node) {
    return ["action", "semantic_and", "semantic_not", "initializer"].includes(
        node.type
    );
}

/**
 * Returns true if `node.expression` should be wrapped in
 * parens to avoid potential confusion (e.g., because
 * the reader has forgotten the precedence of operations)
 *
 * @param {*} node
 */
function nodeExpressionNeedsWrapping(node) {
    if (!node.expression) {
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
        if (node.type === "") return true;
    }
    if (node.type === "labeled" && isSuffixOperator(node.expression)) {
        // Suffix operators will wrap their arguments in parenthesis if needed
        // so we don't need to wrap them in another set
        return false;
    }
    if (["choice", "labeled", "action"].includes(node.expression.type)) {
        return true;
    }
    return false;
}

// The signature of this function is determined by the Prettier
// plugin API.
function printPegjsAst(path, options, print) {
    const node = path.getValue();

    let lhs, rhs, label, prefix, suffix, body, delimiters;
    switch (node.type) {
        case "grammar":
            // This is the root node of a Pegjs grammar
            console.log("The grammar", node);
            body = join(concat([hardline, hardline]), path.map(print, "rules"));

            if (!node.initializer) {
                // A `hardline` is inserted at the end so that any trailing comments
                // are printed
                return concat([body, hardline]);
            }

            // A `hardline` is inserted at the end so that any trailing comments
            // are printed
            return concat([
                path.call(print, "initializer"),
                hardline,
                hardline,
                body,
                hardline,
            ]);
        case "rule":
            lhs = [node.name];
            if (node.displayName) {
                lhs.push(" ", path.call(print, "displayName"));
            }

            rhs = concat([
                line,
                path.call(print, "delimiter"),
                " ",
                path.call(print, "expression"),
            ]);
            return group(concat(lhs.concat(indent(rhs))));

        case "rule_ref":
            return node.name;

        // This is a string a quoted string. E.g., literally `"abc"`
        case "stringliteral":
            return util.makeString(node.value, '"');

        case "delimiter":
            return node.value;

        case "any":
            return ".";

        case "choice":
            rhs = path.map(print, "alternatives");
            if (rhs.length === 0) {
                return "";
            }
            // Delimiters (i.e., "/") are theoretically all the same,
            // but they may have comments surrounding them. To preserve these
            // comments, we actually print them.
            delimiters = path.map(print, "delimiters");

            body = [rhs[0]];
            for (let i = 0; i < delimiters.length; i++) {
                body.push(line, delimiters[i], " ", rhs[i + 1]);
            }
            return concat(body);

        case "literal":
            if (node.ignoreCase) {
                return concat([util.makeString(node.value, '"'), "i"]);
            }
            return util.makeString(node.value, '"');

        case "group":
            return wrapInParenGroup(path.call(print, "expression"));

        case "sequence":
            return group(indent(join(line, path.map(print, "elements"))));

        case "labeled":
            label = node.label;
            rhs = path.call(print, "expression");
            if (nodeExpressionNeedsWrapping(node)) {
                rhs = wrapInParenGroup(rhs);
            }
            lhs = [];
            if (node.pick) {
                lhs.push("@");
            }
            if (label) {
                lhs.push(label, ":");
            }
            return concat([...lhs, rhs]);

        // suffix operators
        case "optional":
        case "zero_or_more":
        case "one_or_more":
            suffix = SUFFIX_MAP[node.type];
            body = path.call(print, "expression");
            if (nodeExpressionNeedsWrapping(node)) {
                return concat([wrapInParenGroup(body), suffix]);
            }
            return concat([body, suffix]);

        // prefix operators
        case "text":
        case "simple_and":
        case "simple_not":
            prefix = PREFIX_MAP[node.type];
            if (nodeExpressionNeedsWrapping(node)) {
                return concat([
                    prefix,
                    wrapInParenGroup(path.call(print, "expression")),
                ]);
            }
            return concat([prefix, path.call(print, "expression")]);

        // Things in square brackets (e.g. `[a-zUVW]`)
        case "class":
            prefix = node.inverted ? "^" : "";
            suffix = node.ignoreCase ? "i" : "";
            lhs = node.parts.map((part) => {
                if (Array.isArray(part)) {
                    return part.join("-");
                }
                return part;
            });

            return concat(["[", prefix, ...lhs, "]", suffix]);

        case "comment":
            return concat(["A COMMENT", node.value]);

        default:
            console.warn(
                `Found node with unknown type '${node.type}'`,
                JSON.stringify(node)
            );
    }

    return concat(["abc"]);
}

/**
 * This is called by Prettier whenever a comment is to be printed.
 * Comments are stored outside of the AST, but Prettier will make its best guess
 * about which node a comment "belongs to". The return Doc of this function
 * is inserted in the appropriate place.
 *
 * @param {*} commentPath
 * @param {*} options
 */
function printComment(commentPath) {
    const comment = commentPath.getValue();

    const prefix = comment.forceBreakAfter ? hardline : "";

    if (comment.multiline) {
        return concat([prefix, "/*", comment.value, "*/"]);
    }
    return concat([prefix, "//", comment.value]);
}

/**
 * Used to print embedded javascript codeblocks. This function
 * is called on every node. If `null` is returned, the Pegjs
 * printer is used. Otherwise, `textToDoc` can be used to select a
 * different one.
 *
 * @param {*} path
 * @param {function} print
 * @param {function} textToDoc
 * @param {object} options
 */
function embed(path, print, textToDoc, options) {
    const node = path.getValue();
    if (!hasCodeBlock(node)) {
        // Returning null tells Prettier to use the default printer
        // (in this case, the Pegjs printer)
        return null;
    }

    function wrapCode(code) {
        // By default, prettier will add a hardline at the end of a parsed document.
        // We don't want this hardline in embedded code.
        const formatted = utils.stripTrailingHardline(
            textToDoc(code, { parser: options.actionParser || "babel" })
        );
        return group(
            concat(["{", indent(concat([line, formatted])), line, "}"])
        );
    }

    let prefix;
    switch (node.type) {
        case "action":
            return concat([
                path.call(print, "expression"),
                indent(concat([" ", wrapCode(node.code)])),
            ]);
        case "semantic_and":
        case "semantic_not":
            prefix = SEMANTIC_SUFFIX_MAP[node.type];

            return concat([prefix, indent(concat([" ", wrapCode(node.code)]))]);
        case "initializer":
            return wrapCode(node.code);
        default:
            return false;
    }
}

/**
 * This is called by prettier whenever it detects a comment on its own
 * line (i.e., only whitespace before/after). We have a chance to change what
 * node the comment is assigned to.
 *
 * @param {object} comment
 * @param {string} text
 * @param {object} options
 * @param {object} ast
 * @param {boolean} isLastComment
 * @returns {boolean} `true` if the comment was handled, `false` to pass through to Prettier's default handler
 */
function handleOwnLineComment(comment, text, options, ast, isLastComment) {
    if (options.debugComments && comment.value.includes("debug")) {
        console.log("handleOwnLineComment", comment);
    }

    const { enclosingNode, precedingNode, followingNode } = comment;

    if (enclosingNode && enclosingNode.type === "choice") {
        // If the comment is on its own line in a `choice` block,
        // It is probably meant to describe one of the choices. In this case,
        // it should be rendered *before* the node it is currently attached to.
        // I.e., at the end of the previous node.
        if (precedingNode) {
            util.addTrailingComment(precedingNode, comment);
            return true;
        }
    }
    if (enclosingNode && enclosingNode.type === "rule") {
        if (followingNode && followingNode.type === "delimiter") {
            // We have a comment before the `=`. For example,
            // abc
            //   // my comment
            //   = some rule
            util.addLeadingComment(followingNode, comment);
            return true;
        }
    }
}

/**
 * This is called by prettier whenever it detects a comment at the end of a line
 * (i.e., there is some non-whitespace on the same line as the comment, but nothing
 * after the comment). We have a chance to change what
 * node the comment is assigned to.
 *
 * @param {object} comment
 * @param {string} text
 * @param {object} options
 * @param {object} ast
 * @param {boolean} isLastComment
 * @returns {boolean} `true` if the comment was handled, `false` to pass through to Prettier's default handler
 */
function handleEndOfLineComment(comment, text, options, ast, isLastComment) {
    if (options.debugComments && comment.value.includes("debug")) {
        console.log("handleEndOfLineComment", comment);
    }

    const { enclosingNode, precedingNode, followingNode } = comment;

    if (
        enclosingNode &&
        (enclosingNode.type === "choice" || enclosingNode.type === "rule")
    ) {
        if (
            !comment.multiline &&
            precedingNode &&
            precedingNode.type === "delimiter"
        ) {
            // Single-line comments that come directly after a delimiter should really
            // be printed *before* that delimiter.
            util.addLeadingComment(precedingNode, comment);
            return true;
        }

        if (
            !comment.multiline &&
            followingNode &&
            followingNode.type === "stringliteral"
        ) {
            // Reformat rules like
            //   a //some comment
            //     "label" = y
            // to
            //   a "label" // some comment
            //     = y
            util.addTrailingComment(followingNode, comment);
            return true;
        }
    }
}

/**
 * This is called by prettier whenever it finds a comment that it cannot classify
 * as `ownLine` or `endOfLine`. We have a chance to change what
 * node the comment is assigned to.
 *
 * @param {object} comment
 * @param {string} text
 * @param {object} options
 * @param {object} ast
 * @param {boolean} isLastComment
 * @returns {boolean} `true` if the comment was handled, `false` to pass through to Prettier's default handler
 */
function handleRemainingComment(comment, text, options, ast, isLastComment) {
    if (options.debugComments && comment.value.includes("debug")) {
        console.log("handleRemainingComment", comment);
    }
}

export const languages = [
    {
        name: "pegjs",
        extensions: [".pegjs"],
        parsers: ["pegjs-parser"],
    },
];

export const parsers = {
    "pegjs-parser": {
        parse,
        astFormat: "pegjs-ast",
        locStart: (node) => (node.loc || { start: { offset: 0 } }).start.offset,
        locEnd: (node) => (node.loc || { end: { offset: 0 } }).end.offset,
    },
};

export const printers = {
    "pegjs-ast": {
        print: printPegjsAst,
        embed,
        canAttachComment: (node) =>
            node && node.type && node.type !== "comment",
        isBlockComment: (node) =>
            node && node.type === "comment" && node.multiline === true,
        printComment,
        handleComments: {
            ownLine: handleOwnLineComment,
            endOfLine: handleEndOfLineComment,
            remaining: handleRemainingComment,
        },
    },
};
