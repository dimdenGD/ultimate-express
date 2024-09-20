# µExpress

The *Ultimate* Express. Fastest http server with **full** Express compatibility, based on µWebSockets.

This library is an extremely fast re-implementation of Express.js.
It is designed to be a drop-in replacement for Express.js, with the same API and functionality, while being much faster. It is not a fork of Express.js.  
To make sure µExpress matches behavior of Express in all cases, we run all tests with Express first, and then with µExpress and compare results to make sure they match.  

![Node.js >= 16.0.0](https://img.shields.io/badge/Node.js-%3E=16.0.0-green)

## Difference from similar projects

Similar projects based on uWebSockets:

- `express` on Bun - since Bun uses uWS for its HTTP module, Express is about 2.5 times faster than on Node.js with 25k req/sec instead of 10k req/sec normally, but still slower than µExpress at 70k req/sec because it doesn't do uWS-specific optimizations.
- `hyper-express` - while having a similar API to Express, it's very far from being a drop-in replacement, and implements most of the functionality differently. This creates a lot of random quirks and issues, making the switch quite difficult. Built in middlewares are also very different.
- `uwebsockets-express` - this library is closer to being a drop-in replacement, but misses a lot of APIs, depends on Express by calling it's methods under the hood, doesn't try to optimize routing by using native uWS router, and is about 2-3 times slower than µExpress.

## Differences from Express

- `case sensitive routing` is enabled by default.
- Depending on how you send response, `Content-Length` header may be overwritten or not sent at all:
- - on simple responses with res.send(), res.json(), etc. it's set automatically (any value you set with res.set() is overwritten)
- - on streaming responses (piping, res.sendFile()) it's not sent because uWS uses chunked transfer encoding instead
- - on responses without body, it *is* sent (useful for HEAD requests)
- request body is only read for POST, PUT and PATCH requests by default. You can add additional methods by setting `body methods` to array with uppercased methods.
- For HTTPS, instead of doing this:

```js
const https = require("https");
const express = require("express");

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
const express = require("u-express");

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

4. By default, µExpress creates 1 worker thread for reading files (or 0 if your CPU has only 1 core). You can change this number by setting `fsThreads` to a different number in `express()`, or set to 0 to disable thread pool for file reading (`express({ fsThreads: 0 })`). Threads are shared between all express() instances, with largest fsThreads number being used. Using more threads will not necessarily improve performance.

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
- ✅ app.param(name, callback)
- ✅ app.param(callback)
- ✅ app.engine()
- ✅ app.render()
- ✅ app.locals
- ✅ app.settings
- ✅ app.engines
- ✅ app.on("mount")
- ✅ HEAD method

### Application settings

- ✅ case sensitive routing
- ✅ env
- ✅ etag
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
- ✅ res.sendFile()
- - ✅ options.maxAge
- - ✅ options.root
- - ✅ options.lastModified
- - ✅ options.headers
- - ✅ options.dotfiles
- - ✅ options.acceptRanges
- - ✅ options.cacheControl
- - ✅ options.immutable
- - ✅ Range header
- - ✅ Setting ETag header
- - ✅ If-Match header
- - ✅ If-Modified-Since header
- - ✅ If-Unmodified-Since header
- ✅ res.sendStatus()
- ✅ res.header(), res.setHeader(), res.set()
- ✅ res.status()
- ✅ res.type()
- ✅ res.vary()
- ✅ res.removeHeader()
- ✅ res.write()
- ✅ res.writeHead()

### Router

- ✅ router.all()
- ✅ router.METHOD() (router.get, router.post, etc.)
- ✅ router.route()
- ✅ router.use()
- ✅ router.param(name, callback)
- ✅ router.param(callback)

## Tested middlewares

Most of the middlewares that are compatible with Express are compatible with µExpress. Here's list of middlewares that we test for compatibility:

- ✅ [body-parser](https://npmjs.com/package/body-parser)
- ✅ [cookie-parser](https://npmjs.com/package/cookie-parser)
- ✅ [cookie-session](https://npmjs.com/package/cookie-session)
- ✅ [serve-static](https://npmjs.com/package/serve-static) (use `express.static()` instead for better performance)
- ✅ [serve-index](https://npmjs.com/package/serve-index)
- ✅ [cors](https://npmjs.com/package/cors)
- ✅ [errorhandler](https://npmjs.com/package/errorhandler)
- ✅ [method-override](https://npmjs.com/package/method-override)
- ✅ [multer](https://npmjs.com/package/multer)
- ✅ [response-time](https://npmjs.com/package/response-time)
- ✅ [express-fileupload](https://npmjs.com/package/express-fileupload)
- ✅ [express-session](https://npmjs.com/package/express-session)
- ✅ [express-rate-limit](https://npmjs.com/package/express-rate-limit)
- ✅ [vhost](https://npmjs.com/package/vhost)

Middlewares that are confirmed to not work:

- ❌ [compression](https://npmjs.com/package/compression) (doesn't error, but doesn't compress)

## Tested view engines

Any Express view engine should work. Here's list of engines we include in our test suite:

- ✅ [ejs](https://npmjs.com/package/ejs)
- ✅ [pug](https://npmjs.com/package/pug)
- ✅ [express-dot-engine](https://npmjs.com/package/express-dot-engine)
- ✅ [express-art-template](https://npmjs.com/package/express-art-template)
- ✅ [express-handlebars](https://npmjs.com/package/express-handlebars)
- ✅ [swig](https://npmjs.com/package/swig)