import { removeDuplicateSlashes } from "./utils.js";

function patternToRegex(pattern, isPrefix = false) {
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
    'get', 'post', 'put', 'delete', 'patch', 'options', 'head', 'trace', 'connect',
    'checkout', 'copy', 'lock', 'mkcol', 'move', 'purge', 'propfind', 'proppatch',
    'search', 'subscribe', 'unsubscribe', 'report', 'mkactivity', 'checkout', 'merge',
    'm-search', 'notify', 'subscribe', 'unsubscribe', 'search'
];

export default class Router {
    #routes;
    constructor(mountpath = "/") {
        this.#routes = [];
        this.mountpath = mountpath;

        methods.forEach(method => {
            this[method] = (path, callback) => {
                this.#createRoute(method.toUpperCase(), path, callback);
            };
        });
    }

    #pathMatches(pattern, path) {
        // /abcd - /abcd
        // /abc?d - /abcd, /abd
        // /ab+cd - /abcd, /abbcd, /abbbbbcd, and so on
        // /ab*cd -  /abcd, /abxcd, /abFOOcd, /abbArcd, and so on
        // /a(bc)?d - /ad and /abcd
        // /:test - /a, /b, /c as query params
        // /* - anything
        // /test/* - /test/a, /test/b, /test/c, /test/a/b/c, and so on
        // /test/:test - /test/a, /test/b, /test/c, /test/a/b/c, and so on
    
        path = removeDuplicateSlashes('/' + path.replace(this.mountpath, ''));
        if(pattern instanceof RegExp) {
            return pattern.test(path);
        }
        
        if(pattern === '*' || pattern === '/*') {
            return true;
        }
    
        return pattern === path;
    }

    #createRoute(method, path, ...callbacks) {
        for(let callback of callbacks) {
            const paths = Array.isArray(path) ? path : [path];
            const routes = [];
            for(let path of paths) {
                const route = {
                    method: method === 'USE' ? 'ALL' : method.toUpperCase(),
                    path,
                    pattern: method === 'USE' || needsConversionToRegex(path) ? patternToRegex(path, method === 'USE') : path,
                    callback,
                };
                routes.push(route);
            }
            this.#routes.push(...routes);
        }
    }

    #extractParams(pattern, path) {
        let match = pattern.exec(path);
        return match?.groups ?? {};
    }

    #preprocessRequest(req, route) {
        let path = removeDuplicateSlashes('/' + req.path.replace(this.mountpath, ''));
        if(route.pattern instanceof RegExp) {
            req.params = this.#extractParams(route.pattern, path);
        } else {
            req.params = {};
        }
    }

    async route(req, res, i = 0) {
        return new Promise(async (resolve, reject) => {
            while (i < this.#routes.length) {
                const route = this.#routes[i];
                if ((route.method === req.method || route.method === 'ALL') && this.#pathMatches(route.pattern, req.path)) {
                    let calledNext = false;
                    this.#preprocessRequest(req, route);
                    if(route.callback instanceof Router) {
                        if(await route.callback.route(req, res, 0)) {
                            resolve(true);
                        } else {
                            resolve(this.route(req, res, i + 1));
                        }
                    } else {
                        await route.callback(req, res, () => {
                            calledNext = true;
                            resolve(this.route(req, res, i + 1));
                        });
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
            callbacks.unshift(path);
            path = '/';
        }
        for(let callback of callbacks) {
            if(callback instanceof Router) {
                let mountpath = removeDuplicateSlashes(this.mountpath + path);
                callback.mountpath = needsConversionToRegex(mountpath) ? patternToRegex(mountpath, true) : mountpath;
                for(let route of callback.#routes) {
                    let nestedRouter = route.callback;
                    if(nestedRouter instanceof Router) {
                        let nestedMountpath = removeDuplicateSlashes(mountpath + nestedRouter.mountpath);
                        nestedRouter.mountpath = needsConversionToRegex(nestedMountpath) ? patternToRegex(nestedMountpath, true) : nestedMountpath;
                    }
                }
            }
        }
        this.#createRoute('USE', path, ...callbacks);
    }
}