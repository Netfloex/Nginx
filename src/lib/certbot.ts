import execSh from "exec-sh";

import log from "@utils/log";
import settings from "@utils/settings";

import { SimpleServer } from "@models/ParsedConfig";

const exec = execSh.promise;

const hasMail = (): boolean => {
	if (settings.certbotMail) {
		return true;
	}
	log.noCertbotEmail();
	return false;
};

const hasCertbot = async (): Promise<boolean> => {
	try {
		await exec("command -v certbot", true);
	} catch (error) {
		log.noCertbot();
		return false;
	}
	return true;
};

const certbotDisabled = (): boolean => {
	if (settings.disableCertbot) {
		log.certbotDisabled();
		return true;
	}
	return false;
};

export const certbot = async (servers: SimpleServer[]): Promise<void> => {
	if (!servers.length) {
		return log.certbotNotNeeded();
	}

	if (!hasMail() || certbotDisabled() || !(await hasCertbot())) {
		return log.skippingCertbot();
	}

	log.startingCertbot(servers.length);

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
				log.certbotError(err.stdout, err.stderr);
			})
			.then((output) => {
				if (output && output.stdout) {
					log.certbotLog(
						certNames.indexOf(certName),
						certNames.length,
						certName,
						output.stdout.split("\n")[0]
					);
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
