import axios from "axios";
import { createWriteStream, ensureFile, pathExists } from "fs-extra";
import { join } from "path";
import { Stream } from "stream";

import createHash from "@utils/createHash";
import { customFilesPath } from "@utils/env";
import log from "@utils/log";

const downloadJSToFile = async (custom_js: string[]): Promise<void> => {
	await Promise.all(
		custom_js.map(async (jsUrl) => {
			const urlHash = createHash(jsUrl);
			const fileName = join(customFilesPath, "js", urlHash + ".js");

			if (await pathExists(fileName)) {
				log.cachedJS(jsUrl);
				return;
			}

			log.downloadJS(jsUrl);
			await axios
				.get<Stream>(jsUrl, { responseType: "stream" })
				.then(async (res) => {
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
