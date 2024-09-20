const { patternToRegex, needsConversionToRegex, deprecated } = require("./utils.js");
const Response = require("./response.js");
const Request = require("./request.js");
const { EventEmitter } = require("tseep");

let routeKey = 0;

const methods = [
    'all',
    'post', 'put', 'delete', 'patch', 'options', 'head', 'trace', 'connect',
    'checkout', 'copy', 'lock', 'mkcol', 'move', 'purge', 'propfind', 'proppatch',
    'search', 'subscribe', 'unsubscribe', 'report', 'mkactivity', 'mkcalendar',
    'checkout', 'merge', 'm-search', 'notify', 'subscribe', 'unsubscribe', 'search'
];

module.exports = class Router extends EventEmitter {
    #routes = [];
    #paramCallbacks = new Map();
    #mountpathCache = new Map();
    #paramFunction;
    constructor(settings = {}) {
        super();

        this.errorRoute = undefined;
        this.mountpath = '/';
        this.settings = settings;

        if(typeof settings.caseSensitive !== 'undefined') {
            this.settings['case sensitive routing'] = settings.caseSensitive;
            delete this.settings.caseSensitive;
        }
        if(typeof settings.strict !== 'undefined') {
            this.settings['strict routing'] = settings.strict;
            delete this.settings.strict;
        }

        for(let method of methods) {
            this[method] = (path, ...callbacks) => {
                this.#createRoute(method.toUpperCase(), path, this, ...callbacks);
            };
        };
    }

    get(path, ...callbacks) {
        if(typeof path === 'string' && callbacks.length === 0) {
            const key = path;
            if(typeof this.settings[key] === 'undefined' && this.parent) {
                return this.parent.get(key);
            } else {
                return this.settings[key];
            }
        }
        return this.#createRoute('GET', path, this, ...callbacks);
    }

    del(path, ...callbacks) {
        deprecated('app.del', 'app.delete');
        return this.#createRoute('DELETE', path, this, ...callbacks);
    }

    #getFullMountpath(req) {
        let fullStack = req._stack.join("");
        let fullMountpath = this.#mountpathCache.get(fullStack);
        if(!fullMountpath) {
            fullMountpath = patternToRegex(fullStack, true);
            this.#mountpathCache.set(fullStack, fullMountpath);
        }
        return fullMountpath;
    }

    #pathMatches(route, req) {
        let path = req._opPath;
        let pattern = route.pattern;

        if (typeof pattern === 'string') {
            if(path === '') {
                path = '/';
            }
            if(!this.get('case sensitive routing')) {
                path = path.toLowerCase();
                pattern = pattern.toLowerCase();
            }
            return pattern === path || pattern === '/*';
        }
        
        return pattern.test(path);
    }

    #createRoute(method, path, parent = this, ...callbacks) {
        callbacks = callbacks.flat();
        let routeSkipKey = routeKey + callbacks.length - 1;
        for(let callback of callbacks) {
            const paths = Array.isArray(path) ? path : [path];
            const routes = [];
            for(let path of paths) {
                if(!this.get('strict routing') && typeof path === 'string' && path.endsWith('/') && path !== '/') {
                    path = path.slice(0, -1);
                }
                if(path === '*') {
                    path = '/*';
                }
                const route = {
                    method: method === 'USE' ? 'ALL' : method.toUpperCase(),
                    path,
                    pattern: method === 'USE' || needsConversionToRegex(path) ? patternToRegex(path, method === 'USE') : path,
                    callback,
                    routeSkipKey,
                    routeKey: routeKey++,
                    use: method === 'USE',
                    all: method === 'ALL' || method === 'USE',
                    gettable: method === 'GET' || method === 'HEAD',
                };
                routes.push(route);
                if(typeof route.pattern === 'string' && route.pattern !== '/*' && !this.parent && this.get('case sensitive routing') && this.uwsApp) {
                    // the only methods that uWS supports natively
                    if(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD', 'CONNECT', 'TRACE'].includes(method)) {
                        this.#optimizeRoute(route, this.#routes);
                    }
                }
            }
            this.#routes.push(...routes);
        }

        return parent;
    }

    // if route is a simple string, its possible to pre-calculate its path
    // and then create a native uWS route for it, which is much faster
    #optimizeRoute(route, routes, optimizedPath = [], stack = []) {
        for(let i = 0; i < routes.length; i++) {
            const r = routes[i];
            if(r.routeKey > route.routeKey) {
                break;
            }
            // if the methods are not the same, and its not an all method, skip it
            if(!r.all && r.method !== route.method) {
                // check if the methods are compatible (GET and HEAD)
                if(!(r.method === 'HEAD' && route.method === 'GET')) {
                    continue;
                }
            }


            if(
                (r.pattern instanceof RegExp && r.pattern.test(route.path)) ||
                (typeof r.pattern === 'string' && (r.pattern === route.path || r.pattern === '/*'))
            ) {
                if(r.callback instanceof Router) {
                    stack.push(r.path);
                    this.#optimizeRoute(r, r.callback.#routes, optimizedPath, stack);
                } else {
                    optimizedPath.push({
                        ...r,
                        fullpath: stack.map(s => s.path).join('') + r.path,
                    });
                }
            }
        }
        if(!stack.length) {
            optimizedPath.push(route);
            this.#registerUwsRoute(route, optimizedPath);
        } else {
            stack.pop();
        }
        return optimizedPath;
    }

    #registerUwsRoute(route, optimizedPath) {
        let method = route.method.toLowerCase();
        if(method === 'all') {
            method = 'any';
        } else if(method === 'delete') {
            method = 'del';
        }
        const fn = async (res, req) => {
            const request = new Request(req, res, this);
            const response = new Response(res, request, this);
            request.res = response;
            response.req = request;
            res.onAborted(() => {
                const err = new Error('Connection closed');
                err.code = 'ECONNRESET';
                response.aborted = true;
                response.socket.emit('error', err);
            });

            let i = 0;
            try {
                const next = async (thingamabob) => {
                    i++;
                    if(thingamabob) {
                        if(thingamabob === 'route') {
                            let routeSkipKey = optimizedPath[i - 1].routeSkipKey;
                            while(optimizedPath[i - 1] && optimizedPath[i - 1].routeKey !== routeSkipKey && i < optimizedPath.length) {
                                i++;
                            }
                        } else {
                            this.#handleError(thingamabob, request, response);
                        }
                    }
                    if(i >= optimizedPath.length) {
                        if(!response.headersSent) {
                            response.status(404).send(this._generateErrorPage(`Cannot ${request.method} ${request.path}`));
                        }
                        return;
                    }
                    request.next = next;
                    const continueRoute = await this.#preprocessRequest(request, response, optimizedPath[i]);
                    if(continueRoute === 'route') {
                        next('route');
                    } else if(continueRoute) {
                        await optimizedPath[i].callback(request, response, next);
                    }
                }

                request.next = next;
                const continueRoute = await this.#preprocessRequest(request, response, optimizedPath[0]);;
                if(continueRoute === 'route') {
                    next('route');
                } else if(continueRoute) {
                    await optimizedPath[0].callback(request, response, next);
                }
            } catch(err) {
                this.#handleError(err, request, response);
            }
        };
        this.uwsApp[method](route.path, fn);
        if(method === 'get') {
            this.uwsApp.head(route.path, fn);
        }
    }

    #handleError(err, request, response) {
        if(this.errorRoute) {
            return this.errorRoute(err, request, response, () => {
                if(!response.headersSent) {
                    response.status(500).send(this._generateErrorPage(err, true));
                }
            });
        }
        console.error(err);
        response.status(500).send(this._generateErrorPage(err, true));
    }

    #extractParams(pattern, path) {
        let match = pattern.exec(path);
        return match?.groups ?? {};
    }

    #preprocessRequest(req, res, route) {
        return new Promise(async resolve => {
            req.route = route;
            if(typeof route.path === 'string' && route.path.includes(':') && route.pattern instanceof RegExp) {
                let path = req.path;
                if(req._stack.length > 0) {
                    path = path.replace(this.#getFullMountpath(req), '');
                }
                req.params = this.#extractParams(route.pattern, path);

                for(let param in req.params) {
                    if(this.#paramCallbacks.has(param) && !req._gotParams.has(param)) {
                        req._gotParams.add(param);
                        const pcs = this.#paramCallbacks.get(param);
                        for(let i = 0; i < pcs.length; i++) {
                            const fn = pcs[i];
                            await new Promise(resolveRoute => {
                                const next = (thingamabob) => {
                                    if(thingamabob) {
                                        if(thingamabob === 'route') {
                                            return resolve('route');
                                        } else {
                                            this.#handleError(thingamabob, req, res);
                                            return resolve(false);
                                        }
                                    }
                                    return resolveRoute();
                                };
                                req.next = next;
                                fn(req, res, next, req.params[param], param);
                            });
                        }
                    }
                }
            } else {
                req.params = {};
            }

            if(route.use && !req.popAt) {
                req._stack.push(route.path);
                req.url = req.path.replace(this.#getFullMountpath(req), '');
                if(!req.url) {
                    req.url = '/';
                }
                req.popAt = route.routeSkipKey + 1;
            }
            if(route.routeKey >= req.popAt) {
                req._stack.pop();
                req.url = req.path.replace(this.#getFullMountpath(req), '');
                if(!req.url) {
                    req.url = '/';
                }
                delete req.popAt;
            }

            resolve(true);
        });
    }

    param(name, fn) {
        if(typeof name === 'function') {
            deprecated('app.param(callback)', 'app.param(name, callback)', true);
            this.#paramFunction = name;
        } else {
            if(this.#paramFunction) {
                if(!this.#paramCallbacks.has(name)) {
                    this.#paramCallbacks.set(name, []);
                }
                this.#paramCallbacks.get(name).push(this.#paramFunction(name, fn));
            } else {
                let names = Array.isArray(name) ? name : [name];
                for(let name of names) {
                    if(!this.#paramCallbacks.has(name)) {
                        this.#paramCallbacks.set(name, []);
                    }
                    this.#paramCallbacks.get(name).push(fn);
                }
            }
        }
    }

    async _routeRequest(req, res, startIndex = 0) {
        return new Promise(async (resolve) => {
            let [routeIndex, route] = this.#routes.findStartingFrom(r => (r.all || r.method === req.method || (r.gettable && req.method === 'HEAD')) && this.#pathMatches(r, req), startIndex);
            if(!route) return resolve(false);

            if(route.callback instanceof Router) {
                req._stack.push(route.path);
                req._opPath = req.path.replace(this.#getFullMountpath(req), '') + (req.endsWithSlash && req.path !== '/' && this.get('strict routing') ? '/' : '');
                req.url = req._opPath + req.urlQuery;
                if(route.callback.constructor.name === 'Application') {
                    req.app = route.callback;
                }

                const routed = await route.callback._routeRequest(req, res, 0);
                if(routed) return resolve(true);

                req._stack.pop();
                req._opPath = (req._stack.length > 0 ? req.path.replace(this.#getFullMountpath(req), '') : req.path) + (req.endsWithSlash && req.path !== '/' && this.get('strict routing') ? '/' : '');
                req.url = req._opPath + req.urlQuery;
                if(req.app.parent && route.callback.constructor.name === 'Application') {
                    req.app = req.app.parent;
                }
                return resolve(this._routeRequest(req, res, routeIndex + 1));
            } else {
                try {
                    const next = (thingamabob) => {
                        routeIndex++;
                        if(thingamabob) {
                            if(thingamabob === 'route') {
                                let routeSkipKey = route.routeSkipKey;
                                while(this.#routes[routeIndex - 1].routeKey !== routeSkipKey && routeIndex < this.#routes.length) {
                                    routeIndex++;
                                }
                            } else {
                                throw thingamabob;
                            }
                        }
                        return resolve(this._routeRequest(req, res, routeIndex));
                    }
                    req.next = next;
                    const continueRoute = await this.#preprocessRequest(req, res, route);
                    if(continueRoute === 'route') {
                        next('route');
                    } else if(continueRoute) {
                        await route.callback(req, res, next);
                    } else {
                        resolve(true);
                    }
                } catch(err) {
                    if(this.errorRoute) {
                        const next = () => {
                            resolve(res.headersSent);
                        };
                        await this.errorRoute(err, req, res, next);
                    } else {
                        this.#handleError(err, req, res);
                    }
                    return resolve(true);
                }
            }
        });
    }
    use(path, ...callbacks) {
        if(typeof path === 'function' || path instanceof Router || (Array.isArray(path) && path.every(p => typeof p === 'function' || p instanceof Router))) {
            if(callbacks.length === 0 && typeof path === 'function' && path.length === 4) {
                this.errorRoute = path;
                return;
            }
            callbacks.unshift(path);
            path = '';
        }
        if(path === '/') {
            path = '';
        }
        for(let callback of callbacks) {
            if(callback instanceof Router) {
                callback.mountpath = path;
                callback.parent = this;
                callback.emit('mount', this);
            }
        }
        this.#createRoute('USE', path, this, ...callbacks);
    }
    
    route(path) {
        let fns = {};
        for(let method of methods) {
            fns[method] = (...callbacks) => {
                return this.#createRoute(method.toUpperCase(), path, fns, ...callbacks);
            };
        }
        fns.get = (...callbacks) => {
            return this.#createRoute('GET', path, fns, ...callbacks);
        };
        return fns;
    }

    _generateErrorPage(err, checkEnv = false) {
        if(checkEnv && this.get('env') === 'production') {
            err = 'Internal Server Error';
        }
        return `<!DOCTYPE html>\n` +
            `<html lang="en">\n` +
            `<head>\n` +
            `<meta charset="utf-8">\n` +
            `<title>Error</title>\n` +
            `</head>\n` +
            `<body>\n` +
            `<pre>${err?.stack ?? err}</pre>\n` +
            `</body>\n` +
            `</html>\n`;
    }
}