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
	// const i = await Promise.all(
	// 	servers
	// 		.map((server) => {
	// 			const sslFiles = Object.values(sslFilesFor(server));
	// 			return sslFiles.map((file) => outputFile(file, ""));
	// 		})
	// 		.flat()
	// );
	for (const certName of certNames) {
		const command = createShellCommand("certbot certonly", {
			"agree-tos": "",
			keep: "",
			authenticator: "webroot",
			"webroot-path": "/var/www/letsencrypt",
			"cert-name": certName,
			domain: certName,
			"key-type": "rsa",
			"preferred-challenges": "http-01",
			email: settings.certbotMail,
			"non-interactive": "",
			...(settings.staging && { "test-cert": "" })
		});

		await exec(command, true).catch((err) => {
			console.log("Certbot ran into an error:");
			console.error(err.stdout);
			console.error(err.stderr);
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
