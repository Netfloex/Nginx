import md5 from "apache-md5";

interface ParsedAuth {
	username: string;
	password: string;
}

/**
 * Creates a htpasswd string from a username and password
 * @param {ParsedAuth} Auth Object
 * @returns
 */

export const htpasswd = ({ username, password }: ParsedAuth): string =>
	`${username}:${md5(password)}`;
