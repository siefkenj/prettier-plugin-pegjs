/* eslint-env node */
const path = require("path");

module.exports = {
    entry: {
        "standalone": "./src/standalone.js",
        "prettier-plugin-pegjs": "./src/prettier-plugin-pegjs.js",
    },
    mode: "development",
    devtool: "source-map",
    output: {
        filename: "[name].js",
        path: path.resolve(__dirname, "build"),
        library: "prettierPluginPegjs",
        globalObject: `(() => {
            if (typeof self !== 'undefined') {
                return self;
            } else if (typeof window !== 'undefined') {
                return window;
            } else if (typeof global !== 'undefined') {
                return global;
            } else {
                return Function('return this')();
            }
        })()`,
        libraryTarget: "umd",
    },
    module: {
        rules: [
            {
                test: /\.pegjs$/,
                use: "pegjs-loader",
            },
        ],
    },
};
