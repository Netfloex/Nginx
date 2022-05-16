## Nginx Config Manager

This docker container makes it a lot easier to manage Nginx configs.

Instead of creating an entire new file with a lot of boilerplate you can just easily add a new line to the config.
Nginx Config Manager will create the Nginx config for you, and automatically requests certificates for it using certbot.
It will also create Diffie-Hellman parameters, this could take a while when the container launches for the first time.
If you use cloudflare, it can also automatically restore your visitor ip addresses. (See [Cloudflare](#cloudflare-real-ip))

## Installation

This version uses `nginx:stable-alpine` as a parent container. This allows it to reload nginx by itself.
If you would like to have a standalone version see [#standalone](#standalone)

[docker-compose.example.yml](docker-compose.example.yml):

The only required change is `CERTBOT_EMAIL`.

[Click Here](#environment-options) for a list of Environment Options.

```yaml
version: "3.3"

services:
    nginx:
        image: netfloex/nginx:v2.4.0
        container_name: nginx
        environment:
            CERTBOT_EMAIL: EMAIL # Required
        ports:
            - 80:80
            - 443:443
        volumes:
            #  Optional

            # - ./logs:/var/log/nginx
            # - ./nginx_config_files:/etc/nginx/conf.d
            - ./data:/app/data # Needed when using custom files or cloudflare, this is used as a cache.

            # Required

            - ./letsencrypt:/etc/letsencrypt
            - ./config:/app/config
```

You can create a config file using json5, js or yaml.
The file should be placed in the config folder as `config.(yml|yaml|json|jsonc|json5|js)`

<a href="config/config.example.js">
<img src="https://img.shields.io/badge/Example-javascript-yellow" alt="javascript">
</a>
<a href="config/config.example.jsonc">
<img src="https://img.shields.io/badge/Example-JSON-green" alt="json">
</a>
<a href="config/config.example.yml">
<img src="https://img.shields.io/badge/Example-YAML-red" alt="yaml">
</a>

Pick your favorite language to write your config in and create a file like "config/config.yml"

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

This example fetches [the latest ips from Cloudflare](#cloudflare-real-ip), enables SSL with Certbot, creates DH-Params, and creates two config files:

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

## Reloading config

The config can be reloaded by sending a SIGHUP signal to the container.
This updates Nginx's configuration files and renews certificates if needed.

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

[Code](src/utils/parseUserConfig.ts)

## Server Options

-   [Proxy Pass](#proxy-pass)
-   [Custom CSS](#custom-css)
-   [Custom JS](#custom-js)
-   [Websocket](#websocket)
-   [Headers](#headers)
-   [Cors](#cors)

-   [Return](#return)
-   [HTML](#html)
-   [Redirect](#redirect)
-   [Rewrite](#rewrite)
-   [Static Files](#static)

-   [Basic Auth](#basic-auth)
-   [Location Blocks](#location-blocks)

## Global Options

-   [Cloudflare Real IP](#cloudflare-real-ip)
-   [Access Log Format](#accesslog-format)

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

[Code](src/lib/createConfig.ts)

### Cors

Adds a `Access-Control-Allow-Origin` header with the supplied value.

Expects an url, or `true`/`*` to allow any origin.

[Code](src/lib/parseConfig.ts)

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

[Code](src/lib/createConfig.ts)

### HTML

For displaying simple HTML.
This is equivalent to `"return": `200 "Message"``

```js
/* Server/Subdomain/Location: */ {
	"html": "<h1>Hello World</h1>"
}
```

[Code](src/lib/createConfig.ts)

### Redirect

Redirect to another location

```js
/* Server/Subdomain/Location: */ {
	redirect: "/new_location";
}
```

[Code](src/lib/createConfig.ts)

### Rewrite

Allows for complex redirects, the redirect only happens if the first argument matches.

This is equivalent to Nginx's [rewrite](https://nginx.org/en/docs/http/ngx_http_rewrite_module.html#rewrite)

> Note: If possible redirect/return should be used.

```js
/* Server/Subdomain/Location: */ {
	rewrite: "^/users/(.*)$ /users?id=$1"; // Redirects /users/test to /users?id=test
}
```

[Code](src/lib/createConfig.ts)

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

> Tip: If you don't want your password visible inside the config use [Variable Substitution](#variable-substitution)

```js
/* Server/Subdomain/Location: */ {
	// Single user
	auth: {
		username: "user",
		password: "pass"
	},

	// Shorthand for using default username (admin by default)
	auth: "password",

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

If you do not specify the username the default will be used (admin), to change this edit:

```js
/* Config: */ {
	username: "bob"
	servers: {
		"example.com": {
			proxy_pass: "http://example",
			auth: "password" // Username is bob
		}
	}
}
```

[Code](src/utils/createAuthFile.ts)

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

[Code](src/utils/editNginxConfig.ts)

## Environment Options

#### Don't Check Hosts

For every `proxy_pass`'s hostname a DNS lookup is performed to test if it can be found in upstream.

If the dns lookup fails the container exits with an error: `Could not resolve: host`.
This check is useful because otherwise Nginx will exit later.

To disable this check, set the following variable:

```bash
DONT_CHECK_HOSTS="true" # Default: false
```

#### Allow unresolved hosts

When nginx encounters a `proxy_pass` directive it does a DNS lookup.
If this fails Nginx will exit / wont start.

To allow starting you can set:

```bash
DONT_EXIT_NO_UPSTREAM="true" # Default: false
```

#### Don't download custom files

Disables the actual downloading of the files specified using `custom_css` or `custom_js`.

Mainly useful for testing in [this workflow](.github/workflows/main.yml)

```bash
DONT_DOWNLOAD_FILES="true" # Default: false
```

#### Cloudflare Cache Duration

The [Cloudflare Option](#cloudflare-real-ip) caches the list of ip addresses.
By default for 7 days.
To customize this duration set the following variable in milliseconds:

```bash
CLOUDFLARE_CACHE_DURATION="2419200000" # Default: 604800000
```

#### Diffie-Hellman parameter size

The default size is 2048, which should be secure enough.
If you make this value larger it will take longer to create.

> Note: if you want to change the size, you should also delete your old dhparam.pem otherwise it won't be recreated.

```bash
DHPARAM_SIZE="2048"
```

#### Disable Certbot

If you have a domain without or with expired certificates this container will request certificates for that domain.

To disable this you can set the following:

```bash
DISABLE_CERTBOT="true"
```

#### Enable config without certificates

A domain without certificates will not be created (because Nginx will throw an error on launch)

If you would like to create configs even when it has missing certificate files:

```bash
ENABLE_CONFIG_MISSING_CERTS="true"
```

#### Certbot Email (Required)

This email is used to request certificates using certbot.
Letsencrypt will send you an email when a certificate expires soon.
In the future an option will be added to register without email using certbot's `--register-unsafely-without-email`. More info [here](https://eff-certbot.readthedocs.io/en/stable/using.html#certbot-command-line-options)

```bash
CERTBOT_EMAIL="email@example.com"
```

#### Letsencrypt Staging environment

When using Letsencrypt's production environment to test things out, there is a high chance you will be running against rate limits.

In order to use the [staging environment](https://letsencrypt.org/docs/staging-environment/):

```bash
STAGING="true"
```

#### ECDSA or RSA certificates

By default the container requests ECDSA certificates, which uses a newer encryption algorithm than RSA certificates.

If you still want RSA certificates:

> Note: You might need to wait until your certificates expire in order to replace them automatically.

```bash
USE_ECDSA="false"
```

#### Watch config file

Watches the config file for changes, and live reloads when it changes.

> Currently this can only be used with the standalone image
> Because the node process wil run forever so nginx won't be started

```bash
WATCH_CONFIG_FILE="true"
```

#### Log formatting

By default the log is formatted so every message starts at the same width.

If you want to disable the adding of spaces you can disable this by setting:

```bash
LOG_FORMAT_COLUMNS="false"
```

#### Disable log elements

If you would like to disable certain elements in the log messages you can:

| 0.100s | [NCM] | [INFO] | [CONFIG] | Config is valid |
| ------ | ----- | ------ | -------- | --------------- |
| Time   | Name  |        | Tag      |                 |

```bash
LOG_SHOW_TIME="false"
LOG_SHOW_NAME="false"
LOG_SHOW_TAG="false"
```

#### Paths

All values are set to there default, the commented value is the path inside the container.

You can update each path by setting the environment variable

```bash
# The config folder
CONFIG_PATH="./config" # /app/config

# If you want to point to a specific file instead of a folder
CONFIG_FILE= # Unset



# Nginx folder
NGINX_PATH="./nginx" # /etc/nginx

# Generated configs folder
NGINX_CONFIG_PATH="$NGINX_PATH/conf.d" # /etc/nginx/conf.d

# The cloudflare ip list config path
CLOUDFLARE_CONFIG_PATH="$NGINX_CONFIG_PATH/cloudflare.conf" # /etc/nginx/conf.d/cloudflare.conf



# Letsencrypt directory
LETSENCRYPT_PATH="/etc/letsencrypt"

# Diffie-Hellman file
DHPARAM_PATH="$LETSENCRYPT_PATH/dhparams/dhparams.pem" # /etc/letsencrypt/dhparams/dhparams.pem



# Data location, cloudflare ip cache, custom files and auth files
DATA_PATH="./data" # /app/data

# Stores custom files: CSS & JS
CUSTOM_FILES_PATH="$DATA_PATH/custom" # /app/data/custom

# Stores auth files, Stores the username:hashed_password
AUTH_PATH="$DATA_PATH/auth" # /app/data/auth

# Stores a cache of the cloudflare ip list.
STORE_PATH="$DATA_PATH/store.json" # /app/data/store.json
```

[Code](src/utils/settings.ts)

# Standalone

You can also run this container without Nginx builtin.

> Keep in mind that this also means that NCM won't be able to reload nginx.

> So you will have to this manually by running `docker exec nginx nginx -s reload` each time new configs are created

If you want you let NCM watch your config file for changes [see here](#watch-config-file)

In order to do so see this [Docker Compose](docker-compose.standalone.yml)

## Old Parent Image

In older versions this container used [JonasAlfredsson/docker-nginx-certbot](https://github.com/JonasAlfredsson/docker-nginx-certbot) as a parent container.
Since version v2.0.0 most of it's features like requesting certificates and generating Diffie-Hellman parameters are now included in this container.
