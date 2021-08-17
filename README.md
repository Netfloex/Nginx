## Nginx Config Manager

This docker container makes it a lot easier to manage Nginx configs.

The container uses [JonasAlfredsson/docker-nginx-certbot](https://github.com/JonasAlfredsson/docker-nginx-certbot) as a parent image.
This means SSL certificates are automatically managed and [more](https://github.com/JonasAlfredsson/docker-nginx-certbot#noteworthy-features).

This container simplifies the process of writing multiple Nginx config files.
There is only one configuration file at `config/config.js`, [example config](config/config.example.js).
Nginx Config Manager expands this one file in to multiple Nginx config files.

The base config can be found [here](src/nginx/baseConfig.conf)

## Features

-   Simpler Configs
-   Auto SSL

-   Proxy Pass
-   Custom CSS
-   Custom JS
-   Websocket
-   Return

-   Location Blocks
-   Cloudflare Real IP

## Getting Started

For an example docker-compose.yml see: [docker-compose.example.yml](docker-compose.example.yml).
The only required change is `CERTBOT_EMAIL`.

[Click Here](#environment-options) for a list of Environment Options.

To create and edit your servers open the file `config/config.js`.

Simple Example:

```js
module.exports = {
	cloudflare: true, // When using Cloudflare
	servers: {
		"example.com": {
			proxy_pass: "http://mysite:3000",
			subdomains: {
				www: "http://mysite:3000" // Converts to www.example.com
			}
		}
	}
};

// The above example could be shorter:
module.exports = {
	servers: {
		"example.com": "http://mysite:3000",
		"www.example.com": "http://mysite:3000"
	}
};
```

This example fetches [the latest ips from Cloudflare](#cloudflare-real-ip), enables SSL with Certbot, and creates two config files:

```
    example.com  >  http://mysite:3000
www.example.com  >  http://mysite:3000
```

A more complete example can be found [here](config/config.example.js).

### Good to Know

The entire config is located in one file.

All properties are optional.

The config is validated by [zod](https://github.com/colinhacks/zod), so you know when you make mistakes.

If you only need a proxy pass you can shorten it:

Instead of writing:

```js
/* servers: */ {
	"example.com": {
		proxy_pass: "http://base_domain:80"
	}
}
```

You can also write:

```js
/* servers: */ {
	"example.com": "http://base_domain:80"
}
```

## Options

This is a list of options possible inside a (sub)domain or location.

### Proxy Pass

Proxies the request to another location.

When the container starts a DNS Lookup is performed to test if the hostname is valid.
To disable this see [Environment Options](#environment-options)

```js
/* Server/Subdomain/Location: */ {
	proxy_pass: "http://hostname:80";
}
```

[Code](src/lib/createConfig.ts)

### Custom CSS

This adds a custom CSS file to an application.
It should be a url to a CSS file.

This file is downloaded and compressed, its then stored inside `/app/custom/css` [Configurable](#paths).
The compressed CSS is then appended to the end of the `<head>` by using Nginx's `sub_filter`.

```js
/* Server/Subdomain/Location: */ {
	custom_css: "http://example.com/style.css";
}
```

[Code](src/utils/downloadCSS.ts)

### Custom JS

This allows to use a custom JS file.
It should be a url to a JS file.

This file is downloaded, its then stored inside `/app/custom/js` [Configurable](#paths).
This file is appended to the end of the `<body>` by using Nginx's `sub_filter`.

```js
/* Server/Subdomain/Location: */ {
	custom_js: "http://example.com/script.js";
}
```

[Code](src/utils/downloadJSToFile.ts)

### Websocket

Option to enable Websocket support, this adds the following to the config:

```conf
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection $http_connection;
proxy_http_version 1.1;
```

Example:

```js
/* Server/Subdomain/Location: */ {
	websocket: true; // Default: false
}
```

[Code](src/lib/createConfig.ts)

### Return

This may be useful to show a custom message or redirect.

This is equivalent to Nginx's [return](https://nginx.org/en/docs/http/ngx_http_rewrite_module.html#return)

```js
/* Server/Subdomain/Location: */ {
	"return": `200 "Hello World!"`
}
```

---

[Code](src/lib/createConfig.ts)

### Location Blocks

```js
/* Server/Subdomain: */ {
	location: {
		"/custom/path": {
			proxy_pass: "http://proxy_pass:80",

			// Any other option...
			custom_css: "http://example.com/style.css"
		}
	}
}
```

or simplified:

```js
/* Server/Subdomain: */ {
	location: {
		"/custom/path": "http://proxy_pass:80"
	}
}
```

[Code](src/lib/createConfig.ts)

### Cloudflare Real IP

Retrieves [Cloudflare's ips](https://api.cloudflare.com/client/v4/ips) and creates a Nginx config to trust their `CF-Connecting-IP` header as a source for a visitors real ip.

By default this data is cached for 7 days. [Edit](#cloudflare-cache-duration)

Currently this only updates when the container starts.

```js
// config.js
module.exports = {
	cloudflare: true,
	servers: {}
};
```

[Code](src/utils/enableCloudflare.ts)

## Environment Options

#### Don't Check Hosts

For every `proxy_pass`'s hostname a DNS lookup is performed to test if it can be found in upstream.

If the dns lookup fails the container exits with an error: `dns lookup failed for: host`.
This check is useful because otherwise Nginx will exit later.

To disable this check, set the following variable:

```bash
DONT_CHECK_HOSTS="true" # Default: false
```

#### Cloudflare Cache Duration

The [Cloudflare Option](#cloudflare-real-ip) caches the ips.
By default for 7 days.
To customize this duration set the following variable in milliseconds:

```bash
CLOUDFLARE_CACHE_DURATION="2419200000" # Default: 604800000
```

#### Paths

```bash
# The config file
CONFIG_PATH="/config.json" # Default: ./config/config.json | Docker: /app/config/config.json

# The default directory, for custom files and store.json
DATA_PATH="/data" # Default: ./data | Docker: /app/data

# Further customization, by default they are inside the directory above
CUSTOM_FILES_PATH="/custom" # Default: $DATA/custom
STORE_PATH="/store.json" # Default: $DATA/store.json
```

[Code](src/utils/env.ts)
