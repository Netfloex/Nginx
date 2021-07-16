import CleanCSS from "clean-css";
import createHash from "./createHash";

type Output = {
	errors?: string[];
	styles: string;
	hash: string;
};
const downloadCSS = async (url: string): Promise<Output> => {
	const css = `@import url(${url});`;
	return await new CleanCSS({
		inline: ["remote"],
		returnPromise: true
	})
		.minify(css)
		.then((output) => {
			const hash = createHash(output.styles);

			return {
				styles: output.styles,
				hash
			};
		})
		.catch((errors) => {
			return {
				errors: errors,
				styles: "",
				hash: ""
			};
		});
};

export default downloadCSS;
