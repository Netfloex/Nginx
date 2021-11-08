import commonjs from "@rollup/plugin-commonjs";
import { nodeResolve } from "@rollup/plugin-node-resolve";
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
	external: ["glob", "json5"],
	plugins: [
		typescript({
			exclude: ["src/tests"],
			tsconfigOverride: {
				compilerOptions: {
					module: "ESNext"
				}
			}
		}),
		commonjs(),
		nodeResolve()
	]
});
