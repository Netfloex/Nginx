import execSh from "exec-sh";

import { logger } from "@lib/logger";
import settings from "@utils/settings";

import { SimpleServer } from "@models/ParsedConfig";

const exec = execSh.promise;

const hasMail = (): boolean => {
	if (settings.certbotMail) {
		return true;
	}
	logger.noCertbotEmail();
	return false;
};

const hasCertbot = async (): Promise<boolean> => {
	try {
		await exec("command -v certbot", true);
	} catch (error) {
		logger.noCertbotBinary();
		return false;
	}
	return true;
};

const certbotDisabled = (): boolean => {
	if (settings.disableCertbot) {
		logger.certbotDisabled();
		return true;
	}
	return false;
};

export const certbot = async (servers: SimpleServer[]): Promise<void> => {
	if (!servers.length) {
		return logger.allValid();
	}
	if (certbotDisabled() || !hasMail() || !(await hasCertbot())) {
		return logger.skippingCertbot();
	}

	logger.requestingCertificates({ count: servers.length });

	const certNames = [
		...new Set(
			servers.map((server) => server.certbot_name ?? server.server_name)
		)
	];

	for (const certName of certNames) {
		const command = createShellCommand("certbot certonly", {
			"agree-tos": "",
			keep: "",
			authenticator: "webroot",
			"webroot-path": "/var/www/letsencrypt",
			"cert-name": certName,
			domain: certName,
			"key-type": settings.useECDSA ? "ecdsa" : "rsa",
			"preferred-challenges": "http-01",
			email: settings.certbotMail,
			"non-interactive": "",
			...(settings.staging && { "test-cert": "" })
		});

		await exec(command, true)
			.catch((err) => {
				logger.certbotError({ messages: [err.stdout, err.stderr] });
			})
			.then((output) => {
				if (output && output.stdout) {
					logger.certbotLog({
						index: certNames.indexOf(certName),
						size: certNames.length,
						certificate: certName,
						log: output.stdout.split("\n")[0]
					});
				}
			});
	}
};

const createShellCommand = (
	command: string,
	args: Record<string, string | undefined>
): string => {
	const result = Object.entries(args).reduce<string[]>(
		(res, [key, val]) => [...res, `--${key}${val ? ` ${val}` : ""}`],
		[]
	);

	return `${command} ${result.join(" ")}`;
};
