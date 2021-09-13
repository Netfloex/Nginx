declare module "apache-md5" {
	function md5(password: string, salt?: string): string;

	export default md5;
}
