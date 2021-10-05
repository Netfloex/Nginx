import { InitialOptionsTsJest } from "ts-jest/dist/types";

const options: InitialOptionsTsJest = {
	preset: "ts-jest",
	testEnvironment: "node",
	roots: ["src/tests"],
	snapshotFormat: {
		printBasicPrototype: false
	},
	clearMocks: true
};

export default options;
