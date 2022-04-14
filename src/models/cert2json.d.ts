declare module "cert2json" {
	interface Certificate {
		tbs: {
			validity: {
				notBefore: Date;
				notAfter: Date;
			};
		};
	}
	export const parse: (certificate: string) => Certificate;
}
