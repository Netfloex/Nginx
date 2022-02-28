const { request } = require("https");

const url =
	"https://gist.githubusercontent.com/Netfloex/2fcf157353a573133b133b2623c32dd2/raw/90f06a7085a6f3f3ab967deb5cbc1196decfb6cb/async-config.js";

module.exports = () => {
	let data = "";

	return new Promise((res, rej) => {
		const req = request(url, (response) => {
			response.on("data", (chunk) => {
				data = data + chunk.toString();
			});

			response.on("end", () => res(JSON.parse(data)));
		});
		req.on("error", rej);
		req.end();
	});
};
