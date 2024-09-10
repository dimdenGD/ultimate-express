# µExpress

The Ultimate Express. Fastest http server with full Express compatibility, based on µWebSockets.

## Compatibility

### express

- ✅ express()
- ✅ express.Router()
- ❌ express.json()
- ❌ express.urlencoded()
- ❌ express.static()
- ❌ express.text()
- ❌ express.raw()

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
- ✅ app.param()
- ❌ app.engine()
- ❌ app.render()
- ❌ app.locals
- ✅ app.settings
- ❌ app.engines
- ❌ app.on("mount")

### Application settings

- ❌ case sensitive routing
- ❌ env
- ❌ etag
- ❌ jsonp callback name
- ❌ json escape
- ❌ json replacer
- ❌ json spaces
- ❌ query parser
- ❌ strict routing
- ❌ subdomain offset
- ❌ trust proxy
- ❌ views
- ❌ view cache
- ❌ view engine
- ❌ x-powered-by

### Request
- ❌ req.app
- ❌ req.baseUrl
- ❌ req.body
- ❌ req.cookies
- ❌ req.fresh
- ❌ req.hostname
- ❌ req.headers
- ❌ req.ip
- ❌ req.ips
- ✅ req.method
- ❌ req.originalUrl
- ✅ req.params
- ✅ req.path
- ❌ req.protocol
- ❌ req.query
- ❌ req.res
- ❌ req.route
- ❌ req.secure
- ❌ req.signedCookies
- ❌ req.stale
- ❌ req.subdomains
- ❌ req.xhr
- ❌ req.accepts()
- ❌ req.acceptsCharsets()
- ❌ req.acceptsEncodings()
- ❌ req.acceptsLanguages()
- ❌ req.get()
- ❌ req.is()
- ❌ req.param()
- ❌ req.range()

### Response

- ❌ res.app
- ❌ res.headersSent
- ❌ res.locals
- ❌ res.append()
- ❌ res.attachment()
- ❌ res.cookie()
- ❌ res.clearCookie()
- ❌ res.download()
- ❌ res.end()
- ❌ res.format()
- ❌ res.get()
- ❌ res.json()
- ❌ res.jsonp()
- ❌ res.links()
- ❌ res.location()
- ❌ res.redirect()
- ❌ res.render()
- ❌ res.send()
- ❌ res.sendFile()
- ❌ res.sendStatus()
- ❌ res.set()
- ❌ res.status()
- ❌ res.type()
- ❌ res.vary()
- ❌ res.header(), res.setHeader(), res.set()
- ❌ res.getHeader(), res.get()
- ❌ res.removeHeader()
- ❌ res.write()
- ❌ res.type()

### Router

- ✅ router.all()
- ✅ router.METHOD() (router.get, router.post, etc.)
- ✅ router.route()
- ✅ router.use()
- ✅ router.param()
