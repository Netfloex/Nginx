<a href="https://github.com/Netfloex/Nginx" >
<img src="https://img.shields.io/github/workflow/status/Netfloex/Nginx/docker-build?label=Github&logo=Github" alt="">
<img src="https://img.shields.io/github/commit-activity/m/Netfloex/Nginx?label=Commits&logo=github" alt="">
</a>


## Nginx Config Manager

This docker container makes it a lot easier to manage Nginx configs.

The container uses [JonasAlfredsson/docker-nginx-certbot](https://github.com/JonasAlfredsson/docker-nginx-certbot) as a parent image.
This means SSL certificates are automatically managed and [more](https://github.com/JonasAlfredsson/docker-nginx-certbot#noteworthy-features).

This container simplifies the process of writing multiple Nginx config files.
There is only one configuration file needed.
Nginx Config Manager expands this one file in to multiple Nginx config files.

## Installation

Docker Compose:

```yaml
version: "3.3"

services:
    nginx:
        image: netfloex/nginx:v1.0.4
        container_name: nginx
        environment:
            CERTBOT_EMAIL: EMAIL # Required
        ports:
            - 80:80
            - 443:443
        volumes:
            #  Optional

            # - ./logs:/var/log/nginx
            # - ./nginx_config_files:/etc/nginx/user_conf.d
            - ./data:/app/data # Needed when using custom files or cloudflare, this is used as a cache.

            # Required

            - ./letsencrypt:/etc/letsencrypt
            - ./config:/app/config
```

You can create a config file using json5, js or yaml.
The file should be placed in the config folder as `config.(yml|yaml|json|jsonc|json5|js)`

<a href="https://github.com/Netfloex/Nginx/blob/master/config/config.example.js">
<img src="https://img.shields.io/badge/Example-javascript-yellow" alt="javascript">
</a>
<a href="https://github.com/Netfloex/Nginx/blob/master/config/config.example.jsonc">
<img src="https://img.shields.io/badge/Example-JSON-green" alt="json">
</a>
<a href="https://github.com/Netfloex/Nginx/blob/master/config/config.example.yml">
<img src="https://img.shields.io/badge/Example-YAML-red" alt="yaml">
</a>

## Server Options

-   [Proxy Pass](https://github.com/Netfloex/Nginx#proxy-pass)
-   [Custom CSS](https://github.com/Netfloex/Nginx#custom-css)
-   [Custom JS](https://github.com/Netfloex/Nginx#custom-js)
-   [Websocket](https://github.com/Netfloex/Nginx#websocket)
-   [Headers](https://github.com/Netfloex/Nginx#headers)
-   [Cors](https://github.com/Netfloex/Nginx#cors)

-   [Return](https://github.com/Netfloex/Nginx#return)
-   [HTML](https://github.com/Netfloex/Nginx#html)
-   [Redirect](https://github.com/Netfloex/Nginx#redirect)
-   [Rewrite](https://github.com/Netfloex/Nginx#rewrite)
-   [Static Files](https://github.com/Netfloex/Nginx#static)

-   [Basic Auth](https://github.com/Netfloex/Nginx#basic-auth)
-   [Location Blocks](https://github.com/Netfloex/Nginx#location-blocks)

## Global Options

-   [Cloudflare Real IP](https://github.com/Netfloex/Nginx#cloudflare-real-ip)
-   [Access Log Format](https://github.com/Netfloex/Nginx#accesslog-format)

## Getting Started

For an example docker-compose.yml see: [docker-compose.example.yml](https://github.com/Netfloex/Nginx/blob/master/docker-compose.example.yml).
The only required change is `CERTBOT_EMAIL`.

[Click Here](https://github.com/Netfloex/Nginx#environment-options) for a list of Environment Options.

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
```

The above example could be shorter:

```js
module.exports = {
	cloudflare: true, // When using Cloudflare
	servers: {
		"example.com": "http://mysite:3000",
		"www.example.com": "http://mysite:3000"
	}
};
```

This example fetches [the latest ips from Cloudflare](https://github.com/Netfloex/Nginx#cloudflare-real-ip), enables SSL with Certbot, and creates two config files:

```
    example.com  >  http://mysite:3000
www.example.com  >  http://mysite:3000
```

A more complete example can be found [here](https://github.com/Netfloex/Nginx/blob/master/config/config.example.js).

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

## Reloading config

The config can be reloaded by sending a SIGHUP signal to the container.
This updates Nginx's configuration files and runs certbot.

When running inside docker:

```bash
docker kill --signal=HUP nginx_config_manager
```

## Variable Substitution

You can use environment variables in your config by using `%env:VARIABLE%`, where `VARIABLE` is your variable.

> Note: currently this is only possible when using JSON \
> Tip: If your using js, you can also use `process.env`

```conf
# environment variables
USERNAME=John
PASSWORD=Doe
```

```jsonc
// config.json
/* Server/Subdomain/Location: */ {
	// Single user
	"auth": {
		"username": "%env:USERNAME%", // "John"
		"password": "%env:PASSWORD%" // "Doe"
	}
}
```

[Code](https://github.com/Netfloex/Nginx/blob/master/src/utils/parseUserConfig.ts)

## Options

This is a list of options possible inside a (sub)domain or location.

### Proxy Pass

Proxies the request to another location.

When the container starts a DNS Lookup is performed to test if the hostname is valid.
To disable this see [Environment Options](https://github.com/Netfloex/Nginx#environment-options)

```js
/* Server/Subdomain/Location: */ {
	proxy_pass: "http://hostname:80";
}
```

[Code](https://github.com/Netfloex/Nginx/blob/master/src/lib/createConfig.ts)

### Custom CSS

This adds a custom CSS file to an application.
It should be a url to a CSS file.

This file is downloaded and compressed, its then stored inside `/app/custom/css` [Configurable](https://github.com/Netfloex/Nginx#paths).
The compressed CSS is then appended to the end of the `<head>` by using Nginx's `sub_filter`.

```js
/* Server/Subdomain/Location: */ {
	custom_css: "http://example.com/style.css";
}
```

[Code](https://github.com/Netfloex/Nginx/blob/master/src/utils/downloadCSS.ts)

### Custom JS

This allows to use a custom JS file.
It should be a url to a JS file.

This file is downloaded, its then stored inside `/app/custom/js` [Configurable](https://github.com/Netfloex/Nginx#paths).
This file is appended to the end of the `<body>` by using Nginx's `sub_filter`.

```js
/* Server/Subdomain/Location: */ {
	custom_js: "http://example.com/script.js";
}
```

[Code](https://github.com/Netfloex/Nginx/blob/master/src/utils/downloadJSToFile.ts)

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

[Code](https://github.com/Netfloex/Nginx/blob/master/src/lib/createConfig.ts)

### Headers

Allows adding headers to the response.

Expects an object with key values of the headers.

```js
/* Server/Subdomain/Location: */ {
	headers: {
		"Content-Type": "text/html",
		"x-powered-by": "overridden"
	};
}
```

[Code](https://github.com/Netfloex/Nginx/blob/master/src/lib/createConfig.ts)

### Cors

Adds a `Access-Control-Allow-Origin` header with the supplied value.

Expects an url, or `true`/`*` to allow any origin.

[Code](https://github.com/Netfloex/Nginx/blob/master/src/lib/parseConfig.ts)

### Return

This may be useful to show a custom message with a custom status code.

This is equivalent to Nginx's [return](https://nginx.org/en/docs/http/ngx_http_rewrite_module.html#return)

```js
/* Server/Subdomain/Location: */ {
	"return": `404 "Not found"`,
	headers: {
		"Content-Type": "text/html",
		"x-powered-by": "overridden"
	};
}
```

[Code](https://github.com/Netfloex/Nginx/blob/master/src/lib/createConfig.ts)

### HTML

For displaying simple HTML.
This is equivalent to `"return": `200 "Message"``

```js
/* Server/Subdomain/Location: */ {
	"html": "<h1>Hello World</h1>"
}
```

[Code](https://github.com/Netfloex/Nginx/blob/master/src/lib/createConfig.ts)

### Redirect

Redirect to another location

```js
/* Server/Subdomain/Location: */ {
	redirect: "/new_location";
}
```

[Code](https://github.com/Netfloex/Nginx/blob/master/src/lib/createConfig.ts)

### Rewrite

Allows for complex redirects, the redirect only happens if the first argument matches.

This is equivalent to Nginx's [rewrite](https://nginx.org/en/docs/http/ngx_http_rewrite_module.html#rewrite)

Note: If possible redirect/return should be used.

```js
/* Server/Subdomain/Location: */ {
	rewrite: "^/users/(.*)$ /users?id=$1"; // Redirects /users/test to /users?id=test
}
```

[Code](https://github.com/Netfloex/Nginx/blob/master/src/lib/createConfig.ts)

### Static Files

Allows hosting static files, same as [root](https://nginx.org/en/docs/http/ngx_http_core_module.html#root)
When not using an absolute path it's relative to `/app`

```js
/* Server/Subdomain/Location: */ {
	static: "site"; // Resolves to /app/site
}
```

Docker Compose

```yaml
volumes:
    - ./site:/app/site
```

### Basic Auth

Enables authorization for a page

Expects an object with username and password. Can also be an array for multiple users.

The password is hashed using Apache's apr1 md5 algorithm. A .htpasswd file is created and stored inside $DATA/auth

> Tip: If you don't want your password visible inside the config use [Variable Substitution](https://github.com/Netfloex/Nginx#variable-substitution)

```js
/* Server/Subdomain/Location: */ {
	// Single user
	auth: {
		username: "user",
		password: "pass"
	},

	// Multiple Users
	auth: [
		{
			username: "bob",
			password: "hi"
		},
		{
			username: "other",
			password: "user"
		}
	]
};
```

[Code](https://github.com/Netfloex/Nginx/blob/master/src/utils/createAuthFile.ts)

---

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

[Code](https://github.com/Netfloex/Nginx/blob/master/src/lib/createConfig.ts)

### Cloudflare Real IP

Retrieves [Cloudflare's ips](https://api.cloudflare.com/client/v4/ips) and creates a Nginx config to trust their `CF-Connecting-IP` header as a source for a visitors real ip.

By default this data is cached for 7 days. [Edit](https://github.com/Netfloex/Nginx#cloudflare-cache-duration)

Currently this only updates when the container starts.

```js
// config.js
module.exports = {
	cloudflare: true,
	servers: {}
};
```

[Code](https://github.com/Netfloex/Nginx/blob/master/src/utils/enableCloudflare.ts)

### Access Log Format

This allows customizing the access log format.
For variables see [here](https://nginx.org/en/docs/varindex.html)

```js
// config.js
module.exports = {
	nginx: {
		log: "$time_local $remote_addr"
	}
};
```

[Code](https://github.com/Netfloex/Nginx/blob/master/src/utils/editNginxConfig.ts)

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

The [Cloudflare Option](https://github.com/Netfloex/Nginx#cloudflare-real-ip) caches the ips.
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
CUSTOM_FILES_PATH="/custom" # Default: $DATA/custom # Used by custom_css & custom_js
AUTH_PATH="/auth" # Default: $DATA/auth # Used by auth
STORE_PATH="/store.json" # Default: $DATA/store.json # Used by cloudflare
```

[Code](https://github.com/Netfloex/Nginx/blob/master/src/utils/env.ts)
