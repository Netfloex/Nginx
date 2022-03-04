declare module "asn1.js" {
	function define(
		name: string,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		body: (this: any) => void
	): {
		encode(
			body: Record<string, Buffer | number>,
			type: string,
			opts: { label?: string }
		);
	};
}
