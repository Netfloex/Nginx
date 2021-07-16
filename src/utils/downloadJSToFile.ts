import axios from "axios";
import { createWriteStream, ensureFile } from "fs-extra";
import { join } from "path";
import createHash from "./createHash";
import env from "./env";
import fileExist from "./fileExist";
import log from "./log";

const downloadJSToFile = async (custom_js: string[]): Promise<void> => {
	await Promise.all(
		custom_js.map(async (jsUrl) => {
			const urlHash = createHash(jsUrl);
			const fileName = join(env.customFilesPath, "js", urlHash + ".js");

			if (await fileExist(fileName)) {
				log.cachedJS(jsUrl);
				return;
			}

			log.downloadJS(jsUrl);
			await axios(jsUrl, { responseType: "stream" }).then(async (res) => {
				await ensureFile(fileName);
				const stream = createWriteStream(fileName);
				stream.on("close", () => {
					log.JSDownloaded(jsUrl);
				});
				res.data.pipe(stream);
			});
		})
	);
};

export default downloadJSToFile;
