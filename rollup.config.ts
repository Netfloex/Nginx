import commonjs from "@rollup/plugin-commonjs";
import { defineConfig } from "rollup";
import { terser } from "rollup-plugin-terser";
import typescript from "rollup-plugin-typescript2";

export default defineConfig({
	input: "src/index.ts",
	output: {
		dir: "dist",
		format: "cjs",
		generatedCode: "es5",
		plugins: [terser()]
	},
	external: [
		"fs-extra",
		"path",
		"axios",
		"rc-config-loader",
		"chalk",
		"url",
		"zod",
		"crypto",
		"dns",
		"fs",
		"glob",
		"clean-css"
	],
	plugins: [
		typescript({
			exclude: ["src/tests"],
			tsconfigOverride: {
				compilerOptions: {
					module: "ESNext"
				}
			}
		}),
		commonjs()
	]
});
