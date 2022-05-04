import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
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
	plugins: [
		json(),
		typescript({
			exclude: ["src/tests"]
		}),
		commonjs({ ignore: ["glob"] }),
		nodeResolve()
	]
});
