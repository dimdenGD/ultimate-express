# µExpress / Ultimate Express

The *Ultimate* Express. Fastest http server with **full** Express compatibility, based on µWebSockets.

This library is a very fast re-implementation of Express.js 4.
It is designed to be a drop-in replacement for Express.js, with the same API and functionality, while being much faster. It is not a fork of Express.js.  
To make sure µExpress matches behavior of Express in all cases, we run all tests with Express first, and then with µExpress and compare results to make sure they match.  

`npm install ultimate-express` -> replace `express` with `ultimate-express` -> done[*](https://github.com/dimdenGD/ultimate-express?tab=readme-ov-file#differences-from-express)  

[![Node.js >= 16.0.0](https://img.shields.io/badge/Node.js-%3E=16.0.0-green)](https://nodejs.org)
[![npm](https://img.shields.io/npm/v/ultimate-express?label=last+version)](https://npmjs.com/package/ultimate-express)
[![Patreon](https://img.shields.io/badge/donate-Patreon-orange)](https://patreon.com/dimdendev)

## Difference from similar projects

Similar projects based on uWebSockets:

- `express` on Bun - since Bun uses uWS for its HTTP module, Express is about 2-3 times faster than on Node.js, but still slower than µExpress because it doesn't do uWS-specific optimizations.
- `hyper-express` - while having a similar API to Express, it's very far from being a drop-in replacement, and implements most of the functionality differently. This creates a lot of random quirks and issues, making the switch quite difficult. Built in middlewares are also very different.
- `uwebsockets-express` - this library is closer to being a drop-in replacement, but misses a lot of APIs, depends on Express by calling it's methods under the hood and doesn't try to optimize routing by using native uWS router.

## Performance

### Test results

Tested using [wrk](https://github.com/wg/wrk) (`-d 60 -t 1 -c 200`). Etag was disabled in both Express and µExpress. Tested on Ubuntu 22.04, Node.js 20.17.0, AMD Ryzen 5 3600, 64GB RAM.

| Test                                          | Express req/sec | µExpress req/sec | Express throughput | µExpress throughput | µExpress speedup |
| --------------------------------------------- | --------------- | ---------------- | ------------------ | ------------------- | ---------------- |
| routing/simple-routes (/)                     | 10.90k          | 70.10k           | 2.04 MB/sec        | 11.57 MB/sec        | **6.43X**        |
| routing/lot-of-routes (/999)                  | 4.66k           | 51.58k           | 0.85 MB/sec        | 8.07 MB/sec         | **11.07X**       |
| routing/some-middlewares (/90)                | 10.18k          | 66.97k           | 1.81 MB/sec        | 10.42 MB/sec        | **6.58X**        |
| routers/nested-routers (/abccc/nested/ddd)    | 10.25k          | 50.98k           | 1.83 MB/sec        | 7.98 MB/sec         | **4.97X**        |
| middlewares/express-static (/static/index.js) | 7.52k           | 31.08k           | 6.92 MB/sec        | 26.48 MB/sec        | **4.13X**        |
| engines/ejs (/test)                           | 5.92k           | 41.64k           | 2.40 MB/sec        | 16.55 MB/sec        | **7.03X**        |
| middlewares/body-urlencoded (/abc)            | 8.01k           | 35.10k           | 1.66 MB/sec        | 7.02 MB/sec         | **4.38X**        |
|                                               |                 |                  |                    |                     | Avg: **6.37X**   |

### Performance against other frameworks

Tested using [bun-http-framework-benchmark](https://github.com/dimdenGD/bun-http-framework-benchmark). This table only includes Node.js results.
For full table with other runtimes, check [here](https://github.com/dimdenGD/bun-http-framework-benchmark?tab=readme-ov-file#results).

|  Framework           | Average       | Ping          | Query         | Body          |
| -------------------- | ------------- | ------------- | ------------- | ------------- |
| uws                  | 94,296.49     | 108,551.92    | 104,756.22    | 69,581.33     |
| hyper-express        | 66,356.707    | 80,002.53     | 69,953.76     | 49,113.83     |
| **ultimate-express** | **46,826.31** | **50,764.93** | **49,117.76** | **40,596.24** |
| h3                   | 35,423.263    | 41,243.68     | 34,429.26     | 30,596.85     |
| fastify              | 33,094.62     | 40,147.67     | 40,076.35     | 19,059.84     |
| hono                 | 26,576.02     | 36,215.35     | 34,656.12     | 8,856.59      |
| koa                  | 24,045.08     | 28,202.12     | 24,590.84     | 19,342.28     |
| express              | 10,411.313    | 11,245.57     | 10,598.74     | 9,389.63      |

### Performance on real-world application

Also tested on a [real-world application](https://nekoweb.org) with templates, static files and dynamic pages with data from database, and showed 1.5-4X speedup in requests per second depending on the page.

## Differences from Express

In a lot of cases, you can just replace `require("express")` with `require("ultimate-express")` and everything works the same. But there are some differences:

- `case sensitive routing` is enabled by default.
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
- only string paths without regex characters like *, +, (), {}, etc. can be optimized.
- only 1-level deep routers can be optimized.  
  
Optimized routes can be up to 10 times faster than normal routes, as they're using native uWS router and have pre-calculated path.

2. Do not use external `serve-static` module. Instead use built-in `express.static()` middleware, which is optimized for uExpress.

3. Do not use `body-parser` module. Instead use built-in `express.text()`, `express.json()` etc.

4. Do not set `body methods` to read body of requests with GET method or other methods that don't need a body. Reading body makes server about 10k req/sec slower.

5. By default, µExpress creates 1 (or 0 if your CPU has only 1 core) child thread to improve performance of reading files. You can change this number by setting `threads` to a different number in `express()`, or set to 0 to disable thread pool (`express({ threads: 0 })`). Threads are shared between all express() instances, with largest `threads` number being used. Using more threads will not necessarily improve performance. Sometimes not using threads at all is faster, please [test](https://github.com/wg/wrk/) both options.

## WebSockets

Since you don't create http server manually, you can't properly use http.on("upgrade") to handle WebSockets. To solve this, there's currently 2 options:

- There's currently another library in works: [Ultimate WS](https://github.com/dimdenGD/ultimate-ws) that implements `ws` module. It's same concept as this library, but for WebSockets: fast drop-in replacement for `ws` module with support for uExpress upgrades.
- You can simply use `app.uwsApp` to access uWebSockets.js `App` instance and call its `ws()` method directly.

## Compatibility

In general, basically all features and options are supported. Use [Express 4.x documentation](https://expressjs.com/en/4x/api.html) for API reference.

✅ - Full support (all features and options are supported)  
🚧 - Partial support (some options are not supported)  
❌ - Not supported  

### express

- ✅ express()
- ✅ express.Router()
- ✅ express.json()
- ✅ express.urlencoded()
- ✅ express.static()
- - Additionally you can pass `options.ifModifiedSince` to support If-Modified-Since header (this header is not supported in normal Express, but is supported in µExpress)
- ✅ express.text()
- ✅ express.raw()
- 🚧 express.request (this is not a constructor but a prototype for replacing methods)
- 🚧 express.response (this is not a constructor but a prototype for replacing methods)

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
- ✅ req.secure
- ✅ req.signedCookies
- ✅ req.stale
- ✅ req.subdomains
- ✅ req.xhr
- 🚧 req.route (route implementation is different from Express)
- 🚧 req.connection, req.socket (only `encrypted`, `remoteAddress`, `localPort` and `remotePort` are supported)
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
- - ✅ If-Modified-Since header (with `options.ifModifiedSince` option)
- - ✅ If-Unmodified-Since header
- - ✅ If-Range header
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
- ✅ options.caseSensitive
- ✅ options.strict
- ✅ options.mergeParams

## Tested middlewares

Most of the middlewares that are compatible with Express are compatible with µExpress. Here's list of middlewares that we test for compatibility:

- ✅ [body-parser](https://npmjs.com/package/body-parser) (use `express.text()` etc instead for better performance)
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