# µExpress

The Ultimate Express. Fastest http server with full Express compatibility, based on µWebSockets.

## Compatibility

### express

- [x] express()
- [x] express.Router()
- [ ] express.json()
- [ ] express.urlencoded()
- [ ] express.static()
- [ ] express.text()
- [ ] express.raw()

### Application

- [x] app.listen()
- [x] app.METHOD() (app.get, app.post, etc.)
- [x] app.route()
- [x] app.all()
- [x] app.use()
- [x] app.mountpath
- [ ] app.set()
- [ ] app.get()
- [ ] app.engine()
- [ ] app.set()
- [ ] app.enable()
- [ ] app.disable()
- [ ] app.enabled()
- [ ] app.disabled()
- [x] app.path()
- [ ] app.param()
- [ ] app.render()
- [ ] app.locals
- [ ] app.on("mount")

### Application settings

- [ ] case sensitive routing
- [ ] env
- [ ] etag
- [ ] jsonp callback name
- [ ] json escape
- [ ] json replacer
- [ ] json spaces
- [ ] query parser
- [ ] strict routing
- [ ] subdomain offset
- [ ] trust proxy
- [ ] views
- [ ] view cache
- [ ] view engine
- [ ] x-powered-by

### Request
- [ ] req.app
- [ ] req.baseUrl
- [ ] req.body
- [ ] req.cookies
- [ ] req.fresh
- [ ] req.hostname
- [ ] req.headers
- [ ] req.ip
- [ ] req.ips
- [x] req.method
- [ ] req.originalUrl
- [x] req.params
- [x] req.path
- [ ] req.protocol
- [ ] req.query
- [ ] req.res
- [ ] req.route
- [ ] req.secure
- [ ] req.signedCookies
- [ ] req.stale
- [ ] req.subdomains
- [ ] req.xhr
- [ ] req.accepts()
- [ ] req.acceptsCharsets()
- [ ] req.acceptsEncodings()
- [ ] req.acceptsLanguages()
- [ ] req.get()
- [ ] req.is()
- [ ] req.param()
- [ ] req.range()

### Response

- [ ] res.app
- [ ] res.headersSent
- [ ] res.locals
- [ ] res.append()
- [ ] res.attachment()
- [ ] res.cookie()
- [ ] res.clearCookie()
- [ ] res.download()
- [ ] res.end()
- [ ] res.format()
- [ ] res.get()
- [ ] res.json()
- [ ] res.jsonp()
- [ ] res.links()
- [ ] res.location()
- [ ] res.redirect()
- [ ] res.render()
- [ ] res.send()
- [ ] res.sendFile()
- [ ] res.sendStatus()
- [ ] res.set()
- [ ] res.status()
- [ ] res.type()
- [ ] res.vary()
- [ ] res.header(), res.setHeader(), res.set()
- [ ] res.getHeader(), res.get()
- [ ] res.removeHeader()
- [ ] res.write()
- [ ] res.type()

### Router

- [x] router.all()
- [x] router.METHOD() (router.get, router.post, etc.)
- [x] router.route()
- [x] router.use()
- [ ] router.param()
