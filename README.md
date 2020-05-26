# prettier-plugin-pegjs

A prettier plugin for formatting Pegjs grammars

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
npm run prettier -- path/to/grammar.pegjs --write
```

If you installed globally, run

```bash
prettier path/to/grammar.pegjs --write
```

### In the Browser

This package exposes a `standalone.js` that wraps prettier and exports a
`printPrettier` function that can be called as

```js
printPrettier(YOUR_CODE, {
    // example option
    tabWidth: 2,
});
```
