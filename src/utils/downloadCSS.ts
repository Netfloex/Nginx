import CleanCSS from "clean-css";

import { createHash } from "@utils/createHash";

type Output =
	| {
			errors: unknown;
	  }
	| {
			styles: string;
			hash: string;
	  };

/**
 * Requests a remote CSS file and minifies it
 *
 * It will also include `@import` directives
 * @param url The url of the CSS file
 * @returns {string} Compressed CSS string
 */

export const downloadCSS = async (url: string): Promise<Output> => {
	const css = `@import url(${url});`;
	return await new CleanCSS({
		inline: ["all"],
		rebase: true,
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
		.catch((errors: unknown) => {
			return {
				errors
			};
		});
};
