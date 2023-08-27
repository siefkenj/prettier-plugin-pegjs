# prettier-plugin-pegjs

A prettier plugin for formatting Pegjs grammars. You can try it out online in the [playground](https://siefkenj.github.io/prettier-pegjs-playground/)

## Intro

Prettier is an opinionated code formatter. It enforces a consistent style by parsing your code and re-printing it with its own rules that take the maximum line length into account, wrapping code when necessary.

This plugin adds support for the Pegjs language to Prettier.

### Input

```
Expression    = head:Term tail:(_("+"/"-")_ Term) * {
return tail.reduce(function(result, element) {if (element[1] === "+") { return result + element[3]; }
        if (element[1] === "-") { return result - element[3]; }
      }, head)}
```

### Output

```
Expression
  = head:Term tail:(_ "+" / "-" _ Term)* {
      return tail.reduce(function (result, element) {
        if (element[1] === "+") {
          return result + element[3];
        }
        if (element[1] === "-") {
          return result - element[3];
        }
      }, head);
    }
```

## Install

yarn:

```bash
yarn add --dev prettier prettier-plugin-pegjs
# or globally
yarn global add prettier prettier-plugin-pegjs
```

npm:

```bash
npm install --save-dev prettier prettier-plugin-pegjs
# or globally
npm install --global prettier prettier-plugin-pegjs
```

### Notes on global installation

As of v3, Prettier no longer automatically searches for plugins, so you must specify plugins
with the `--plugin` option. You can try `--plugin=prettier-plugin-pegjs`. If that doesn't work,
specify `--plugin=path/to/node_modules/prettier-plugin-pegjs/dist/prettier-plugin-pegjs.js`

## Use

### With Node.js

If you installed prettier as a local dependency, you can add prettier as a
script in your `package.json`,

```json
{
    "scripts": {
        "prettier": "prettier"
    }
}
```

and then run it via

```bash
yarn run prettier path/to/grammar.pegjs --write
# or
npm run prettier path/to/grammar.pegjs --write
```

If you installed globally, run

```bash
prettier path/to/grammar.pegjs --write
```

### In the Browser

This package exposes a `standalone.ts` that wraps prettier and exports a
`printPrettier` function that can be called as

```js
printPrettier(YOUR_CODE, {
    // example option
    tabWidth: 2,
});
```

## Options

The standard Prettier options (such as `tabWidth`) can be used. Additionally,
you may set `actionParser` to specify how the code inside a Pegjs `action` is
printed. `actionParser` can be the parser from any valid Prettier plugin.
It defaults to `"babel-ts"` for Javascript and Typescript, but it could be set
to a different parser if your actions are written in a different language/dialect.

## Development

To make a production build, run

```
npm run build
```

To develop, run

```
npm run watch
```

You can then execute Prettier with

```
prettier --plugin-search-dir=./ ...
```

or

```
prettier --plugin=./build/prettier-plugin-pegjs.js ...
```

and the Pegjs plugin will load from the current directory.

### Code structure

`prettier-plugin-pegjs` uses a Pegjs grammar (located in `grammars/`)
to parse Pegjs grammars! This grammar is slightly modified from Pegjs's
official grammar to include delimiters and strings as AST nodes.
For example, the `=` in `Rule = a / b` is assigned an AST node.
This is so that `prettier-plugin-pegjs` can use Prettier's automatic
comment placement algorithm, which searches through the AST and places comments
based on an AST node's `start` and `end` position.

`prettier-plugin-pegjs` uses webpack to dynamically compile imported
Pegjs grammars, so they can be used _like_ native ES6 imports, though
of course they are not.

The plugin is organized as follows:

-   `prettier-plugin-pegjs.ts` This file exports the objects required of a
    Prettier plugin.
-   `standalone.ts` This file wraps the Prettier parser and pre-loads
    `prettier-plugin-pegjs` as a plugin.
-   `grammars/pegjs.peggy` The Pegjs grammar that parsers Pegjs/Peggy grammars.
-   `libs/parser.ts` The parser which loads a Pegjs-created parser and creates
    an AST from a string.
-   `libs/printer.ts` Printers take an AST and produce a Doc (the intermediate
    format that Prettier uses). This is where most of the details of the plugin lie.
