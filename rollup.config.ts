import commonjs from "@rollup/plugin-commonjs";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import replace from "@rollup/plugin-replace";
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
		replace({
			// The package cert2json does not instantiate the variable `i` which strict mode or rollup does not like
			// So this fixes it temporarily
			values: {
				"for (i = 0;": "for (let i = 0;"
			},
			delimiters: ["", ""],
			include: "**/cert2json/src/der.js",
			preventAssignment: true
		}),
		typescript({
			exclude: ["src/tests"]
		}),
		commonjs({ ignore: ["glob"] }),
		nodeResolve()
	]
});
