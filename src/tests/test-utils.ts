export const replaceCurrentDir = <T>(msg: T): T | string =>
	typeof msg == "string"
		? msg.replace(new RegExp(process.cwd(), "g"), "/current")
		: msg;
