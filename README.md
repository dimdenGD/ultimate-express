# µExpress

The *Ultimate* Express. Fastest http server with **full** Express compatibility, based on µWebSockets.

This library is an extremely fast re-implementation of Express.js.
It is designed to be a drop-in replacement for Express.js, with the same API and functionality, while being much faster. It is not a fork of Express.js.


## Difference from similar projects

Similar projects based on uWebSockets:

- `express` on Bun - since Bun uses uWS for its HTTP module, Express is about 2.5 times faster than on Node.js with 25k req/sec instead of 10k req/sec normally, but still slower than µExpress at 70k req/sec because it doesn't do uWS-specific optimizations.
- `hyper-express` - while having a similar API to Express, it's very far from being a drop-in replacement, and implements most of the functionality differently. This creates a lot of random quirks and issues, making the switch quite difficult. Built in middlewares are also very different.
- `uwebsockets-express` - this library is closer to being a drop-in replacement, but misses a lot of APIs, depends on Express by calling it's methods under the hood, doesn't try to optimize routing by using native uWS router, and is about 2-3 times slower than µExpress.

## Differences from Express

- `case sensitive routing` is enabled by default.
- request body is only read for POST, PUT and PATCH requests by default. You can add additional methods by setting `body methods` to array with uppercased methods.
- For HTTPS, instead of doing this:

```js
import https from 'https';
import express from 'express';

const app = express();

https.createServer({
    key: fs.readFileSync('path/to/key.pem'),
    cert: fs.readFileSync('path/to/cert.pem')
}, app).listen(3000, () => {
    console.log('Server is running on port 3000');
});
```

You have to pass `uwsOptions` to the `express()` constructor:
```js
import express from 'u-express';

const app = express({
    uwsOptions: {
        // https://unetworking.github.io/uWebSockets.js/generated/interfaces/AppOptions.html
        key_file_name: 'path/to/key.pem',
        cert_file_name: 'path/to/cert.pem'
    }
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
```

- This also applies to non-SSL HTTP too. Do not create http server manually, use `app.listen()` instead.

## Performance tips

1. µExpress tries to optimize routing as much as possible, but it's only possible if:
- `case sensitive routing` is enabled (it is by default, unlike in normal Express).
- only string paths without regex characters like *, +, (), {}, :param, etc. can be optimized.
Optimized routes can be up to 10 times faster than normal routes, as they're using native uWS router.

2. Do not use external `serve-static` module. Instead use built-in `express.static()` middleware, which is optimized for uExpress.

3. Do not set `body methods` to read body of requests with GET method or other methods that don't need a body. Reading body makes server about 10k req/sec slower.

## Compatibility

WORK IN PROGRESS. Features with ❌ will be implemented in the future.

### express

- ✅ express()
- ✅ express.Router()
- ✅ express.json()
- ✅ express.urlencoded()
- ❌ express.static()
- ✅ express.text()
- ✅ express.raw()

### Application

- ✅ app.listen()
- ✅ app.METHOD() (app.get, app.post, etc.)
- ✅ app.route()
- ✅ app.all()
- ✅ app.use()
- ✅ app.mountpath
- ✅ app.set()
- ✅ app.get()
- ✅ app.enable()
- ✅ app.disable()
- ✅ app.enabled()
- ✅ app.disabled()
- ✅ app.path()
- ⚠️ app.param() (deprecated `app.param(callback)` is not supported)
- ✅ app.engine()
- ✅ app.render()
- ✅ app.locals
- ✅ app.settings
- ✅ app.engines
- ✅ app.on("mount")

### Application settings

- ✅ case sensitive routing
- ✅ env
- ❌ etag
- ✅ jsonp callback name
- ✅ json escape
- ✅ json replacer
- ✅ json spaces
- ✅ query parser
- ✅ strict routing
- ✅ subdomain offset
- ✅ trust proxy
- ✅ views
- ✅ view cache
- ✅ view engine
- ✅ x-powered-by

### Request
- ✅ implements Readable stream
- ✅ req.app
- ✅ req.baseUrl
- ✅ req.body
- ✅ req.cookies
- ✅ req.fresh
- ✅ req.hostname
- ✅ req.headers
- ✅ req.headersDistinct
- ✅ req.rawHeaders
- ✅ req.ip
- ✅ req.ips
- ✅ req.method
- ✅ req.url
- ✅ req.originalUrl
- ✅ req.params
- ✅ req.path
- ✅ req.protocol
- ✅ req.query
- ✅ req.res
- ⚠️ req.route (route impl. differs from express)
- ✅ req.secure
- ✅ req.signedCookies
- ✅ req.stale
- ✅ req.subdomains
- ✅ req.xhr
- ⚠️ req.connection, req.socket (only `encrypted`, `remoteAddress`, `localPort` and `remotePort` are supported)
- ✅ req.accepts()
- ✅ req.acceptsCharsets()
- ✅ req.acceptsEncodings()
- ✅ req.acceptsLanguages()
- ✅ req.get()
- ✅ req.is()
- ✅ req.param()
- ✅ req.range()

### Response

- ✅ implements Writable stream
- ✅ res.app
- ✅ res.headersSent
- ✅ res.req
- ✅ res.locals
- ✅ res.append()
- ✅ res.attachment()
- ✅ res.cookie()
- ✅ res.clearCookie()
- ✅ res.download()
- ✅ res.end()
- ✅ res.format()
- ✅ res.getHeader(), res.get()
- ✅ res.json()
- ✅ res.jsonp()
- ✅ res.links()
- ✅ res.location()
- ✅ res.redirect()
- ✅ res.render()
- ✅ res.send()
- ⚠️ res.sendFile() (`options` not supported yet)
- ✅ res.sendStatus()
- ✅ res.header(), res.setHeader(), res.set()
- ✅ res.status()
- ✅ res.type()
- ✅ res.vary()
- ✅ res.removeHeader()
- ✅ res.write()

### Router

- ✅ router.all()
- ✅ router.METHOD() (router.get, router.post, etc.)
- ✅ router.route()
- ✅ router.use()
- ⚠️ router.param() (deprecated `router.param(callback)` is not supported)

## Tested middlewares

- ✅ cookie-parser
- ✅ body-parser
- ✅ serve-static

## Tested view engines

- ✅ pug
- ✅ express-art-template