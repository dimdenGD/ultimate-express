import { removeDuplicateSlashes } from "./utils.js";

let routeKey = 0;

function patternToRegex(pattern, isPrefix = false) {
    if(pattern instanceof RegExp) {
        return pattern;
    }
    if(isPrefix && pattern === '/') {
        return new RegExp(`^(?=$|\/)`);
    }

    let regexPattern = pattern
        .replace(/\//g, '\\/') // Escape slashes
        .replace(/\*/g, '.*') // Convert * to .*
        .replace(/:(\w+)/g, (match, param) => {
            return `(?<${param}>[^/]+)`;
        }); // Convert :param to capture group

    return new RegExp(`^${regexPattern}${isPrefix ? '(?=$|\/)' : '$'}`);
}

function needsConversionToRegex(pattern) {
    if(pattern instanceof RegExp) {
        return false;
    }
    if(pattern === '*' || pattern === '/*') {
        return false;
    }

    return pattern.includes('*') || pattern.includes('?') || pattern.includes('+') || pattern.includes('(') || pattern.includes(')') || pattern.includes(':');
}

const methods = [
    'all',
    'post', 'put', 'delete', 'patch', 'options', 'head', 'trace', 'connect',
    'checkout', 'copy', 'lock', 'mkcol', 'move', 'purge', 'propfind', 'proppatch',
    'search', 'subscribe', 'unsubscribe', 'report', 'mkactivity', 'mkcalendar',
    'checkout', 'merge', 'm-search', 'notify', 'subscribe', 'unsubscribe', 'search'
];

export default class Router {
    #routes;
    #paramCallbacks;
    constructor() {
        this.errorRoute = undefined;
        this.#routes = [];
        this.#paramCallbacks = {};
        this.mountpath = '/';

        methods.forEach(method => {
            this[method] = (path, ...callbacks) => {
                this.#createRoute(method.toUpperCase(), path, this, ...callbacks);
            };
        });
    }

    get(path, ...callbacks) {
        return this.#createRoute('GET', path, this, ...callbacks);
    }

    getFullMountpath(req) {
        return patternToRegex(removeDuplicateSlashes('/' + req._stack.join('/')), true);
    }

    #pathMatches(pattern, req) {
        // /abcd - /abcd
        // /abc?d - /abcd, /abd
        // /ab+cd - /abcd, /abbcd, /abbbbbcd, and so on
        // /ab*cd -  /abcd, /abxcd, /abFOOcd, /abbArcd, and so on
        // /a(bc)?d - /ad and /abcd
        // /:test - /a, /b, /c as query params
        // /* - anything
        // /test/* - /test/a, /test/b, /test/c, /test/a/b/c, and so on
        // /test/:test - /test/a, /test/b, /test/c, /test/a/b/c, and so on
        
        let path = req.path;

        // console.log(
        //     `mount: ${this.getFullMountpath(req)} pattern: ${pattern} path: ${path} => ${removeDuplicateSlashes('/' + path.replace(this.getFullMountpath(req), ''))}`,
        //     ((pattern instanceof RegExp && pattern.test(path.replace(this.getFullMountpath(req), ''))) || pattern === path.replace(this.getFullMountpath(req), '')) ? 'YES' : 'NO'
        // );

        path = removeDuplicateSlashes('/' + path.replace(this.getFullMountpath(req), ''));
        if(pattern instanceof RegExp) {
            return pattern.test(path);
        }
        
        if(pattern === '*' || pattern === '/*') {
            return true;
        }
        
        return pattern === path;
    }

    #createRoute(method, path, parent = this, ...callbacks) {
        callbacks = callbacks.flat();
        let routeSkipKey = routeKey + callbacks.length - 1;
        for(let callback of callbacks) {
            const paths = Array.isArray(path) ? path : [path];
            const routes = [];
            for(let path of paths) {
                const route = {
                    method: method === 'USE' ? 'ALL' : method.toUpperCase(),
                    path,
                    pattern: method === 'USE' || needsConversionToRegex(path) ? patternToRegex(path, method === 'USE') : path,
                    callback,
                    routeSkipKey,
                    routeKey: routeKey++
                };
                routes.push(route);
            }
            this.#routes.push(...routes);
        }

        return parent;
    }

    #extractParams(pattern, path) {
        let match = pattern.exec(path);
        return match?.groups ?? {};
    }

    async #preprocessRequest(req, res, route) {
        let path = removeDuplicateSlashes('/' + req.path.replace(this.getFullMountpath(req), ''));
        if(route.pattern instanceof RegExp) {
            req.params = this.#extractParams(route.pattern, path);

            for(let param in req.params) {
                if(this.#paramCallbacks[param] && !req._gotParams.includes(param)) {
                    req._gotParams.push(param);
                    for(let fn of this.#paramCallbacks[param]) {
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
            if(!this.#paramCallbacks[name]) {
                this.#paramCallbacks[name] = [];
            }
            this.#paramCallbacks[name].push(fn);
        }
    }

    async _routeRequest(req, res, i = 0) {
        return new Promise(async (resolve, reject) => {
            while (i < this.#routes.length) {
                if(res.aborted) {
                    resolve(false);
                    return;
                }
                const route = this.#routes[i];
                if ((route.method === req.method || route.method === 'ALL') && this.#pathMatches(route.pattern, req)) {
                    let calledNext = false;
                    await this.#preprocessRequest(req, res, route);
                    if(route.callback instanceof Router) {
                        req._stack.push(route.path);
                        if(await route.callback._routeRequest(req, res, 0)) {
                            resolve(true);
                        } else {
                            req._stack.pop();
                            resolve(this._routeRequest(req, res, i + 1));
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
                                resolve(this._routeRequest(req, res, i + 1));
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
                    return;
                }
                i++;
            }
            resolve(false);
        });
    }
    use(path, ...callbacks) {
        if(typeof path !== 'string') {
            if(callbacks.length === 0 && typeof path === 'function' && path.length === 4) {
                this.errorRoute = path;
                return;
            }
            callbacks.unshift(path);
            path = '/';
        }
        let paths = Array.isArray(path) ? path : [path];
        for(let path of paths) {
            for(let callback of callbacks) {
                if(callback instanceof Router) {
                    callback.mountpath = removeDuplicateSlashes('/' + path);
                    callback.parent = this;
                }
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