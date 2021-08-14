## Nginx

This docker container makes it a lot easier to manage Nginx configs.
The default is https.
There is one configuration file `config/config.js`, [example config](config/config.example.js).

## Features

-   Simpler Configs

-   Proxy Pass
-   Custom CSS
-   Custom JS
-   Location Blocks
-   Cloudflare Real IP

### Simpler Configs

The entire config is located in one file.
All properties are optional.
If you only want to proxypass a (sub)domain you can shorten it:

Instead of:

```jsonc
{
	"example.com": {
		"proxy_pass": "http://base_domain:80"
	}
}
```

You can also write:

```jsonc
{
	"example.com": "http://base_domain:80"
}
```

## Options

This is a list of options possible inside a (sub)domain block.

### Proxy Pass

Proxies the request to another location

```jsonc
{
	"proxy_pass": "http://hostname:80"
}
```

### Custom CSS

This allows to use a custom CSS file.
It should be a url to a CSS file.
This file is downloaded and compressed, its then stored inside `/app/custom/css`.
The compressed CSS is then appended to the end of the `<head>` by using nginx's `sub_filter`.

```jsonc
/* Server/Subdomain/Location: */ {
	"custom_css": "http://example.com/style.css"
}
```

### Custom JS

This allows to use a custom JS file.
It should be a url to a JS file.
This file is downloaded, its then stored inside `/app/custom/js`.
The compressed CSS is then appended to the end of the `<body>` by using nginx's `sub_filter`.

```jsonc
/* Server/Subdomain/Location: */ {
	"custom_js": "http://example.com/script.js"
}
```

### Location Blocks

```jsonc
/* Server/Subdomain: */ {
	"location": {
		"/custom/path": {
			"proxy_pass": "http://proxy_pass:80",

			// Any other option...
			"custom_css": "http://example.com/style.css"
		}
	}
}
```

or

```jsonc
/* Server/Subdomain: */ {
	"location": {
		"/custom/path": "http://proxy_pass:80"
	}
}
```

### Cloudflare Real IP

Restores the original visitors ip when using Cloudflare as a proxy

```jsonc
// config.js
{
	"cloudflare": true,
	"servers": {}
}
```

## Install

See the [docker-compose.example.yml](docker-compose.example.yml)
You will need to edit the `CERBOT_EMAIL`.
Then you can edit `config/config.js`, the example config can be found [here](config/config.example.js).
