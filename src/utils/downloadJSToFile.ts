import axios from "axios";
import { createWriteStream, ensureFile, pathExists } from "fs-extra";
import { join } from "path";
import { Stream } from "stream";

import createHash from "@utils/createHash";
import log from "@utils/log";
import settings from "@utils/settings";

const downloadJSToFile = async (custom_js: string[]): Promise<void> => {
	await Promise.all(
		custom_js.map(async (jsUrl): Promise<void> => {
			const urlHash = createHash(jsUrl);
			const fileName = join(
				settings.customFilesPath,
				"js",
				urlHash + ".js"
			);

			if (await pathExists(fileName)) {
				log.cachedJS(jsUrl);
				return;
			}

			log.downloadJS(jsUrl);
			return new Promise((resolve, reject) => {
				axios
					.get<Stream>(jsUrl, { responseType: "stream" })
					.then(async (res) => {
						await ensureFile(fileName);
						const stream = createWriteStream(fileName);
						stream.on("close", () => {
							log.JSDownloaded(jsUrl);
							resolve();
						});
						res.data.pipe(stream);
					})
					.catch(reject);
			});
		})
	);
};

export default downloadJSToFile;
