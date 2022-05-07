import axios from "axios";
import { ensureFile, createWriteStream } from "fs-extra";
import { Stream } from "stream";

import { logger } from "@lib/logger";

export const downloadFile = async (path: string, url: string): Promise<void> =>
	axios.get<Stream>(url, { responseType: "stream" }).then(async (res) => {
		await ensureFile(path);
		return new Promise((resolve, reject) => {
			const stream = createWriteStream(path);
			stream.on("close", () => {
				logger.downloadedJS({ url });
				resolve();
			});
			stream.on("error", reject);
			res.data.pipe(stream);
		});
	});
