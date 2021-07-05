// @ts-check
/**
 * @type {import('../src/models/config').default}
 **/
module.exports = {
	servers: {
		"example.com": {
			proxy_pass: "http://base_domain:80", // example.com
			subdomains: {
				www: {
					// www.example.com
					proxy_pass: "http://www:80"
				},
				// api.example.com
				api: "http://api:3000" // no extra configuration
			}
		},
		"second_domain.com": "http://second:80" // defaults to proxy_pass
	}
};
