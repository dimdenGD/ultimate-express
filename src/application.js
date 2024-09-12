import uWS from 'uWebSockets.js';
import Response from './response.js';
import Request from './request.js';
import Router from './router.js';
import { removeDuplicateSlashes } from './utils.js';

const supportedOptions = [
    "case sensitive routing",
    "env",
    "etag",
    "jsonp callback name",
    "json escape",
    "json replacer",
    "json spaces",
    "query parser",
    "strict routing",
    "subdomain offset",
    "trust proxy",
    "views",
    "view cache",
    "view engine",
    "x-powered-by",
]

class Application extends Router {
    constructor(settings = {}) {
        super();
        this.uwsApp = uWS.App(settings?.uwsOptions ?? {});
        this.port = undefined;
        this.settings = settings;
    }

    set(key, value) {
        if(supportedOptions.includes(key)) {
            this.settings[key] = value;
        } else {
            throw new Error(`Unsupported option: ${key}`);
        }
        return this;
    }

    get(key, ...args) {
        if(typeof key === 'string' && args.length === 0) {
            if(supportedOptions.includes(key)) {
                return this.settings[key];
            } else {
                throw new Error(`Unsupported option: ${key}`);
            }
        }
        return super.get(key, ...args);
    }

    enable(key) {
        if(supportedOptions.includes(key)) {
            this.settings[key] = true;
        } else {
            throw new Error(`Unsupported option: ${key}`);
        }
        return this;
    }

    disable(key) {
        if(supportedOptions.includes(key)) {
            this.settings[key] = false;
        } else {
            throw new Error(`Unsupported option: ${key}`);
        }
        return this;
    }

    enabled(key) {
        if(supportedOptions.includes(key)) {
            return this.settings[key];
        } else {
            throw new Error(`Unsupported option: ${key}`);
        }
    }

    disabled(key) {
        if(supportedOptions.includes(key)) {
            return !this.settings[key];
        } else {
            throw new Error(`Unsupported option: ${key}`);
        }
    }

    #createRequestHandler() {
        this.uwsApp.any('/*', async (res, req) => {
            res.onAborted(() => {
                res.aborted = true;
            });

            const request = new Request(req, res, this);
            const response = new Response(res);
            let matchedRoute = await this._routeRequest(request, response);

            if(!matchedRoute && !res.aborted && !response.sent) {
                response.status(404);
                response.send(this._generateErrorPage(`Cannot ${request.method} ${request.path}`));
            }
        });
    }

    listen(port, callback) {
        this.#createRequestHandler();
        if(!callback && typeof port === 'function') {
            callback = port;
            port = 0;
        }
        this.uwsApp.listen(port, socket => {
            this.port = uWS.us_socket_local_port(socket);
            if(!socket) {
                let err = new Error('EADDRINUSE: address already in use ' + this.port);
                err.code = 'EADDRINUSE';
                throw err;
            }
            callback(this.port);
        });
    }

    address() {
        return { port: this.port };
    }

    path() {
        let paths = [this.mountpath];
        let parent = this.parent;
        while(parent) {
            paths.unshift(parent.mountpath);
            parent = parent.parent;
        }
        let path = removeDuplicateSlashes(paths.join(''));
        return path === '/' ? '' : path;
    }
}

export default function(options) {
    return new Application(options);
}