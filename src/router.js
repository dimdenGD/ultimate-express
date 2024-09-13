import { patternToRegex, needsConversionToRegex } from "./utils.js";
import uWS from 'uWebSockets.js';
import Response from './response.js';
import Request from './request.js';

let routeKey = 0;

const methods = [
    'all',
    'post', 'put', 'delete', 'patch', 'options', 'head', 'trace', 'connect',
    'checkout', 'copy', 'lock', 'mkcol', 'move', 'purge', 'propfind', 'proppatch',
    'search', 'subscribe', 'unsubscribe', 'report', 'mkactivity', 'mkcalendar',
    'checkout', 'merge', 'm-search', 'notify', 'subscribe', 'unsubscribe', 'search'
];

export default class Router {
    #routes = [];
    #paramCallbacks = new Map();
    #mountpathCache = new Map();
    constructor(settings = {}) {
        this.uwsApp = uWS.App(settings?.uwsOptions ?? {});
        this.errorRoute = undefined;
        this.mountpath = '/';

        for(let method of methods) {
            this[method] = (path, ...callbacks) => {
                this.#createRoute(method.toUpperCase(), path, this, ...callbacks);
            };
        };
    }

    get(path, ...callbacks) {
        return this.#createRoute('GET', path, this, ...callbacks);
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
        const pattern = route.pattern;

        if (typeof pattern === 'string') {
            if(path === '') {
                path = '/';
            }
            return pattern === path || pattern === '*' || pattern === '/*';
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
                if(typeof path === 'string' && path.endsWith('/') && path !== '/') {
                    path = path.slice(0, -1);
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
                };
                routes.push(route);
                if(typeof route.pattern === 'string' && route.pattern !== '*' && route.pattern !== '/*' && !this.parent) {
                    this.#optimizeRoute(route, this.#routes);
                }
            }
            this.#routes.push(...routes);
        }

        return parent;
    }

    #optimizeRoute(route, routes, optimizedPath = [], stack = []) {
        for(let i = 0; i < routes.length; i++) {
            const r = routes[i];
            if(r.routeKey > route.routeKey) {
                break;
            }
            if(!r.all && r.method !== route.method) {
                continue;
            }
            if(
                (r.pattern instanceof RegExp && r.pattern.test(route.path)) ||
                (typeof r.pattern === 'string' && (r.pattern === route.path || r.pattern === '*' || r.pattern === '/*'))
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
        this.uwsApp[method](route.path, async (res, req) => {
            res.onAborted(() => {
                res.aborted = true;
            });

            const request = new Request(req, res, this);
            const response = new Response(res);

            await this.#preprocessRequest(request, response, route);
            let i = 0;
            try {
                const next = (thingamabob) => {
                    i++;
                    if(thingamabob) {
                        if(thingamabob === 'route') {
                            let routeSkipKey = optimizedPath[i - 1].routeSkipKey;
                            while(optimizedPath[i - 1] && optimizedPath[i - 1].routeKey !== routeSkipKey && i < optimizedPath.length) {
                                i++;
                            }
                        } else {
                            throw thingamabob;
                        }
                    }
                    if(i >= optimizedPath.length) {
                        return;
                    }
                    optimizedPath[i].callback(request, response, next);
                }
                optimizedPath[0].callback(request, response, next);
            } catch(err) {
                if(this.errorRoute) {
                    await this.errorRoute(err, request, response, () => {
                        if(!response.sent) {
                            response.status(500).send(this._generateErrorPage('Internal Server Error'));
                        }
                    });
                    return;
                } else {
                    console.error(err);
                    // TODO: support env setting
                    response.status(500).send(this._generateErrorPage('Internal Server Error'));
                }
            }
        });
    }

    #extractParams(pattern, path) {
        let match = pattern.exec(path);
        return match?.groups ?? {};
    }

    async #preprocessRequest(req, res, route) {
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
                    for(let fn of this.#paramCallbacks.get(param)) {
                        await new Promise(resolve => fn(req, res, resolve, req.params[param], param));
                    }
                }
            }
        } else {
            req.params = {};
        }

        return true;
    }

    param(name, fn) {
        let names = Array.isArray(name) ? name : [name];
        for(let name of names) {
            if(!this.#paramCallbacks.has(name)) {
                this.#paramCallbacks.set(name, []);
            }
            this.#paramCallbacks.get(name).push(fn);
        }
    }

    async _routeRequest(req, res, i = 0) {
        return new Promise(async (resolve) => {
            while (i < this.#routes.length) {
                if(res.aborted) {
                    resolve(false);
                    return;
                }
                const route = this.#routes[i];
                if ((route.all || route.method === req.method) && this.#pathMatches(route, req)) {
                    let calledNext = false, dontStop = false;
                    await this.#preprocessRequest(req, res, route);
                    if(route.callback instanceof Router) {
                        req._stack.push(route.path);
                        req._opPath = req.path.replace(this.#getFullMountpath(req), '');
                        req.url = req._opPath + req.urlQuery;

                        if(await route.callback._routeRequest(req, res, 0)) {
                            resolve(true);
                        } else {
                            req._stack.pop();
                            req._opPath = req._stack.length > 0 ? req.path.replace(this.#getFullMountpath(req), '') : req.path;
                            req.url = req._opPath + req.urlQuery;
                            dontStop = true;
                        }
                    } else {
                        try {
                            await route.callback(req, res, thingamabob => {
                                calledNext = true;
                                if(thingamabob) {
                                    if(thingamabob === 'route') {
                                        let routeSkipKey = route.routeSkipKey;
                                        while(this.#routes[i].routeKey !== routeSkipKey && i < this.#routes.length) {
                                            i++;
                                        }
                                    } else {
                                        throw thingamabob;
                                    }
                                }
                                dontStop = true;
                            });
                        } catch(err) {
                            if(this.errorRoute) {
                                await this.errorRoute(err, req, res, () => {
                                    resolve(res.sent);
                                });
                                return resolve(true);
                            } else {
                                console.error(err);
                                // TODO: support env setting
                                res.status(500).send(this._generateErrorPage('Internal Server Error'));
                            }
                        }
                    }
                    if(!calledNext) {
                        resolve(true);
                    }
                    if(!dontStop) {
                        return;
                    }
                }
                i++;
            }
            resolve(false);
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

    _generateErrorPage(err) {
        return `<!DOCTYPE html>\n` +
            `<html lang="en">\n` +
            `<head>\n` +
            `<meta charset="utf-8">\n` +
            `<title>Error</title>\n` +
            `</head>\n` +
            `<body>\n` +
            `<pre>${err}</pre>\n` +
            `</body>\n` +
            `</html>\n`;
    }
}