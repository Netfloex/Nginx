import { compilerOptions } from "./tsconfig.json";
import { pathsToModuleNameMapper, InitialOptionsTsJest } from "ts-jest";

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
