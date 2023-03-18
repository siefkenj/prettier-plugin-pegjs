import { PluginOption } from "vite";
import { defineConfig } from "vitest/config";
import * as peggy from "peggy";

export default defineConfig({
    plugins: [peggyTransformer()],
    build: {
        outDir: "./build",
        lib: {
            entry: {
                "prettier-plugin-pegjs": "./src/prettier-plugin-pegjs.js",
                standalone: "./src/standalone.js",
            },
            formats: ["cjs"],
        },
        rollupOptions: {
            output: {
                exports: "named",
                manualChunks: {},
            },
        },
        sourcemap: true,
    },
    
    test: {
        globals: true,
    },
});

function peggyTransformer(): PluginOption {
    return {
        name: "rollup-plugin-peggy",
        transform(code, id, options) {
            if (!id.match(/\.(peggy|pegjs)$/)) {
                return;
            }
            const parserSource = peggy.generate(code, {
                output: "source",
                format: "es",
            });
            return { code: parserSource };
        },
    };
}
