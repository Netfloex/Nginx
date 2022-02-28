export const replaceCurrentDir = (config: string): string =>
	config.replace(new RegExp(process.cwd(), "g"), "/current");
