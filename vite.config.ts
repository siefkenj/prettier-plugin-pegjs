import { PluginOption } from "vite";
import { defineConfig } from "vitest/config";
import peggy from "peggy";

export default defineConfig({
    plugins: [peggyTransformer()],
    build: {
        // We clear the outDir before building in the `npm run build` step
        // and then populate it with typescript files, so avoid clearing here.
        emptyOutDir: false,
        outDir: "./build",
        lib: {
            entry: {
                "prettier-plugin-pegjs": "./src/prettier-plugin-pegjs.ts",
                standalone: "./src/standalone.ts",
            },
            formats: ["es", "cjs"],
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
