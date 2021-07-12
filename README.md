## Nginx

This docker container makes it a lot easier to manage Nginx configs.
The default is https.
There is one configuration file `config/config.js`, [example config](config/config.example.js).

## Features

-   Simpler configs

-   Proxy Pass
-   Custom CSS

### Simpler Configs

The entire config is located in one file.
All properties are optional.
If you only want to proxypass a (sub)domain you can shorten it:

Instead of:

```json
{
	"example.com": {
		"proxy_pass": "http://base_domain:80"
	}
}
```

You can also write:

```json
{
	"example.com": "http://base_domain:80"
}
```

## Options

This is a list of options possible inside a (sub)domain block.

### Proxy Pass

Proxies the request to another location

```json
{
	"proxy_pass": "http://hostname:80"
}
```

### Custom CSS

This allows to use a custom CSS file.
It should be a url to a CSS file.
This file is downloaded and compressed, its then stored inside `/app/custom/css`.
The compressed CSS is then appended to the end of the `<head>` by using nginx's `sub_filter`.

```json
{
	"custom_css": "url to css file"
}
```

## Install

See the [docker-compose.example.yml](docker-compose.example.yml)
You will need to edit the `CERBOT_EMAIL`.
Then you can edit `config/config.js`, the example config can be found [here](config/config.js).
