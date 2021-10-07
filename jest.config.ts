import { compilerOptions } from "./tsconfig.json";
import { InitialOptionsTsJest } from "ts-jest/dist/types";
import { pathsToModuleNameMapper } from "ts-jest/utils";

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
