module.exports = {
	cloudflare: true, // Restore original visitor ips
	servers: {
		"example.com": {
			proxy_pass: "http://base_domain:80", // example.com
			subdomains: {
				// Basic Usage, can be shortened
				www: {
					// www.example.com
					proxy_pass: "http://www:80"
				},
				// Shortened example, no extra configuration
				api: "http://api:3000", // api.example.com

				// Custom CSS example
				adguard: {
					// adguard.example.com
					proxy_pass: "http://adguard:80",
					// This file gets downloaded and compressed, its then appended to the <head>
					custom_css:
						"https://theme-park.dev/CSS/themes/adguard/organizr-dark.css"
				},

				// Custom JS example
				custom: {
					// custom.example.com
					proxy_pass: "http://custom:80",
					// This file gets downloaded, its then appended to the <body>
					custom_js:
						"https://example.com/custom-javascript-injected.js"
				},

				//  Advanced example: Enables darkmode on vaultwarden and enables a websocket on a different location
				bitwarden: {
					proxy_pass: "http://bitwarden:80",
					custom_css:
						"https://theme-park.dev/CSS/themes/bitwarden/organizr-dark.css",
					locations: {
						"/notifications/hub": {
							proxy_pass: "http://bitwarden:3012",
							websocket: true
						},
						"/notifications/hub/negotiate": "http://bitwarden:80"
					}
				},

				// Simple message
				text: {
					html: "Hello World!"
				},

				// Auth example
				auth: {
					proxy_pass: "http://super_secret:80",
					auth: {
						username: "username",
						password: "password"
					}
				}
			}
		},
		"second_domain.com": "http://second:80" // defaults to proxy_pass
	}
};
