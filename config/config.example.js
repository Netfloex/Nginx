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
					proxy_pass: "http://www:80" // You could also shorten this by using a string instead of an object.
				},
				// api.example.com
				api: "http://api:3000", // Shortened, no extra configuration

				adguard: {
					// adguard.example.com
					proxy_pass: "http://adguard:80",
					// This file gets downloaded and compressed, its then appended to the <head>
					custom_css:
						"https://theme-park.dev/CSS/themes/adguard/organizr-dark.css"
				}
			}
		},
		"second_domain.com": "http://second:80" // defaults to proxy_pass
	}
};
