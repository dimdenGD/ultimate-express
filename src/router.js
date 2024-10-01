/*
Copyright 2024 dimden.dev

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

const { patternToRegex, needsConversionToRegex, deprecated, findIndexStartingFrom, canBeOptimized } = require("./utils.js");
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
const supportedUwsMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD', 'CONNECT', 'TRACE'];

module.exports = class Router extends EventEmitter {
    #paramCallbacks = new Map();
    #mountpathCache = new Map();
    #paramFunction;
    constructor(settings = {}) {
        super();

        this._routes = [];
        this.errorRoute = undefined;
        this.mountpath = '/';
        this.settings = settings;
        this._request = Request;
        this._response = Response;
        this.request = this._request.prototype;
        this.response = this._response.prototype;

        if(typeof settings.caseSensitive !== 'undefined') {
            this.settings['case sensitive routing'] = settings.caseSensitive;
            delete this.settings.caseSensitive;
        }
        if(typeof settings.strict !== 'undefined') {
            this.settings['strict routing'] = settings.strict;
            delete this.settings.strict;
        }

        if(typeof this.settings['case sensitive routing'] === 'undefined') {
            this.settings['case sensitive routing'] = true;
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
            const res = this.settings[key];
            if(typeof res === 'undefined' && this.parent) {
                return this.parent.get(key);
            } else {
                return res;
            }
        }
        return this.#createRoute('GET', path, this, ...callbacks);
    }

    del(path, ...callbacks) {
        deprecated('app.del', 'app.delete');
        return this.#createRoute('DELETE', path, this, ...callbacks);
    }

    getFullMountpath(req) {
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
            if(pattern === '/*') {
                return true;
            }
            if(path === '') {
                path = '/';
            }
            if(!this.get('case sensitive routing')) {
                path = path.toLowerCase();
                pattern = pattern.toLowerCase();
            }
            return pattern === path;
        }
        
        return pattern.test(path);
    }

    #createRoute(method, path, parent = this, ...callbacks) {
        callbacks = callbacks.flat();
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
                callbacks,
                routeKey: routeKey++,
                use: method === 'USE',
                all: method === 'ALL' || method === 'USE',
                gettable: method === 'GET' || method === 'HEAD',
            };
            routes.push(route);
            // normal routes optimization
            if(canBeOptimized(route.path) && route.pattern !== '/*' && !this.parent && this.get('case sensitive routing') && this.uwsApp) {
                if(supportedUwsMethods.includes(method)) {
                    const optimizedPath = this.#optimizeRoute(route, this._routes);
                    if(optimizedPath) {
                        this.#registerUwsRoute(route, optimizedPath);
                    }
                }
            }
            // router optimization
            if(
                route.use && !needsConversionToRegex(path) && path !== '/*' && // must be predictable path
                this.get('case sensitive routing') && // uWS only supports case sensitive routing
                callbacks.filter(c => c instanceof Router).length === 1 && // only 1 router can be optimized per route
                callbacks[callbacks.length - 1] instanceof Router // the router must be the last callback
            ) {
                let callbacksBeforeRouter = [];
                for(let callback of callbacks) {
                    if(callback instanceof Router) {
                        // get optimized path to router
                        let optimizedPathToRouter = this.#optimizeRoute(route, this._routes);
                        if(!optimizedPathToRouter) {
                            break;
                        }
                        optimizedPathToRouter = optimizedPathToRouter.slice(0, -1); // remove last element, which is the router itself
                        if(optimizedPathToRouter) {
                            // wait for routes in router to be registered
                            setTimeout(() => {
                                if(!this.listenCalled) {
                                    return; // can only optimize router whos parent is listening
                                }
                                for(let cbroute of callback._routes) {
                                    if(!needsConversionToRegex(cbroute.path) && cbroute.path !== '/*' && supportedUwsMethods.includes(cbroute.method)) {
                                        let optimizedRouterPath = this.#optimizeRoute(cbroute, callback._routes);
                                        if(optimizedRouterPath) {
                                            optimizedRouterPath = optimizedRouterPath.slice(0, -1);
                                            const optimizedPath = [...optimizedPathToRouter, {
                                                // fake route to update req._opPath and req.url
                                                ...route,
                                                callbacks: [
                                                    (req, res, next) => {
                                                        next('skipPop');
                                                    }
                                                ]
                                            }, ...optimizedRouterPath];
                                            this.#registerUwsRoute({
                                                ...cbroute,
                                                path: route.path + cbroute.path,
                                                pattern: route.path + cbroute.path,
                                                optimizedRouter: true
                                            }, optimizedPath);
                                        }
                                    }
                                }
                            }, 100);
                        }
                        // only 1 router can be optimized per route
                        break;
                    } else {
                        callbacksBeforeRouter.push(route);
                    }
                }
            }
        }
        this._routes.push(...routes);

        return parent;
    }

    // if route is a simple string, its possible to pre-calculate its path
    // and then create a native uWS route for it, which is much faster
    #optimizeRoute(route, routes) {
        const optimizedPath = [];

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

            // check if the paths match
            if(
                (r.pattern instanceof RegExp && r.pattern.test(route.path)) ||
                (typeof r.pattern === 'string' && (r.pattern === route.path || r.pattern === '/*'))
            ) {
                if(r.callbacks.some(c => c instanceof Router)) {
                    return false; // cant optimize nested routers with matches
                }
                optimizedPath.push(r);
            }
        }
        optimizedPath.push(route);

        return optimizedPath;
    }

    handleRequest(res, req) {
        const request = new this._request(req, res, this);
        const response = new this._response(res, request, this);
        request.res = response;
        response.req = request;
        res.onAborted(() => {
            const err = new Error('Connection closed');
            err.code = 'ECONNRESET';
            response.aborted = true;
            response.socket.emit('error', err);
        });

        return { request, response };
    }

    #registerUwsRoute(route, optimizedPath) {
        let method = route.method.toLowerCase();
        if(method === 'all') {
            method = 'any';
        } else if(method === 'delete') {
            method = 'del';
        }
        if(!route.optimizedRouter && route.path.includes(":")) {
            route.optimizedParams = route.path.match(/:(\w+)/g).map(p => p.slice(1));
        }
        const fn = async (res, req) => {
            const { request, response } = this.handleRequest(res, req);
            if(route.optimizedParams) {
                request.optimizedParams = {};
                for(let i = 0; i < route.optimizedParams.length; i++) {
                    request.optimizedParams[route.optimizedParams[i]] = req.getParameter(i);
                }
            }
            const matchedRoute = await this._routeRequest(request, response, 0, optimizedPath, true, route);
            if(!matchedRoute && !response.headersSent && !response.aborted) {
                response.status(404);
                response.send(this._generateErrorPage(`Cannot ${request.method} ${request.path}`, false));
            }
        };
        route.optimizedPath = optimizedPath;
        let replacedPath = route.path.replace(/:(\w+)/g, ':x');
        this.uwsApp[method](replacedPath, fn);
        if(!this.get('strict routing') && route.path[route.path.length - 1] !== '/') {
            this.uwsApp[method](replacedPath + '/', fn);
            if(method === 'get') {
                this.uwsApp.head(replacedPath + '/', fn);
            }
        }
        if(method === 'get') {
            this.uwsApp.head(replacedPath, fn);
        }
    }

    #handleError(err, request, response) {
        let errorRoute = this.errorRoute, parent = this.parent;
        while(!errorRoute && parent) {
            errorRoute = parent.errorRoute;
            parent = parent.parent;
        }
        if(errorRoute) {
            return errorRoute(err, request, response, () => {
                if(!response.headersSent) {
                    if(response.statusCode === 200) {
                        response.statusCode = 500;
                    }
                    response.send(this._generateErrorPage(err, true));
                }
            });
        }
        console.error(err);
        if(response.statusCode === 200) {
            response.statusCode = 500;
        }
        response.send(this._generateErrorPage(err, true));
    }

    #extractParams(pattern, path) {
        let match = pattern.exec(path);
        const obj = match?.groups ?? {};
        for(let i = 1; i < match.length; i++) {
            obj[i - 1] = match[i];
        }
        return obj;
    }

    #preprocessRequest(req, res, route) {
            req.route = route;
            if(route.optimizedParams) {
                req.params = req.optimizedParams;
            } else if(typeof route.path === 'string' && (route.path.includes(':') || route.path.includes('*')) && route.pattern instanceof RegExp) {
                let path = req.path;
                if(req._stack.length > 0) {
                    path = path.replace(this.getFullMountpath(req), '');
                }
                req.params = this.#extractParams(route.pattern, path);
                if(req._paramStack.length > 0) {
                    for(let params of req._paramStack) {
                        req.params = {...params, ...req.params};
                    }
                }
            } else {
                req.params = {};
                if(req._paramStack.length > 0) {
                    for(let params of req._paramStack) {
                        req.params = {...params, ...req.params};
                    }
                }
            }

            if(this.#paramCallbacks.size > 0) {
                return new Promise(async resolve => {
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
                });
            }
            return true;
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

    async _routeRequest(req, res, startIndex = 0, routes = this._routes, skipCheck = false, skipUntil) {
        return new Promise(async (resolve) => {
            let routeIndex = skipCheck ? startIndex : findIndexStartingFrom(routes, r => (r.all || r.method === req.method || (r.gettable && req.method === 'HEAD')) && this.#pathMatches(r, req), startIndex);
            const route = routes[routeIndex];
            if(!route) {
                if(!skipCheck) {
                    // on normal unoptimized routes, if theres no match then there is no route
                    return resolve(false);
                }
                // on optimized routes, there can be more routes, so we have to use unoptimized routing and skip until we find route we stopped at
                return resolve(this._routeRequest(req, res, 0, this._routes, false, skipUntil));
            }
            let callbackindex = 0;
            let continueRoute = await this.#preprocessRequest(req, res, route);
            if(route.use) {
                req._stack.push(route.path);
                req._opPath = 
                    req.path.replace(this.getFullMountpath(req), '') + 
                    (req.endsWithSlash && req.path !== '/' && this.get('strict routing') ? '/' : '');
                req.url = req._opPath + req.urlQuery;
                if(req.url === '') req.url = '/';
            }
            const next = async (thingamabob) => {
                if(thingamabob) {
                    if(thingamabob === 'route' || thingamabob === 'skipPop') {
                        if(route.use && thingamabob !== 'skipPop') {
                            req._stack.pop();
                            req._opPath = 
                                (req._stack.length > 0 ? req.path.replace(this.getFullMountpath(req), '') : req.path) + 
                                (req.endsWithSlash && req.path !== '/' && this.get('strict routing') ? '/' : '');
                            req.url = req._opPath + req.urlQuery;
                            if(req.url === '') req.url = '/';
                            if(req.app.parent && route.callback.constructor.name === 'Application') {
                                req.app = req.app.parent;
                            }
                        }
                        return resolve(this._routeRequest(req, res, routeIndex + 1, routes, skipCheck, skipUntil));
                    } else {
                        this.#handleError(thingamabob, req, res);
                        return resolve(true);
                    }
                }
                const callback = route.callbacks[callbackindex++];
                if(!callback) {
                    return next('route');
                }
                if(callback instanceof Router) {
                    if(callback.constructor.name === 'Application') {
                        req.app = callback;
                    }
                    if(callback.settings.mergeParams) {
                        req._paramStack.push(req.params);
                    }
                    const routed = await callback._routeRequest(req, res, 0);
                    if(routed) return resolve(true);
                    next();
                } else {
                    try {
                        // skipping routes we already went through via optimized path
                        if(!skipCheck && skipUntil && skipUntil.routeKey >= route.routeKey) {
                            return next();
                        }
                        const out = callback(req, res, next);
                        if(out instanceof Promise) {
                            out.catch(err => {
                                throw err;
                            });
                        }
                    } catch(err) {
                        this.#handleError(err, req, res);
                        return resolve(true);
                    }
                }
            }
            req.next = next;
            if(continueRoute === 'route') {
                next('route');
            } else if(continueRoute) {
                next();
            } else {
                resolve(true);
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