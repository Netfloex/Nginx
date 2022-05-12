declare module "cert2json" {
	interface Certificate {
		tbs: {
			validity: {
				notBefore: Date;
				notAfter: Date;
			};

			issuer: {
				full: string;
			};
		};
	}
	export const parse: (certificate: string) => Certificate;
}
