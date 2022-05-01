import { compilerOptions } from "./tsconfig.json";
import { pathsToModuleNameMapper, InitialOptionsTsJest } from "ts-jest";

process.env.FORCE_COLOR = "0";
process.env.LOG_SHOW_TIME = "0";

const options: InitialOptionsTsJest = {
	preset: "ts-jest",
	testEnvironment: "node",
	roots: ["src/tests"],
	snapshotFormat: {
		printBasicPrototype: false
	},
	clearMocks: true,
	moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
		prefix: "../../"
	})
};

export default options;
