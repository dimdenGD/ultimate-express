import uWS from 'uWebSockets.js';
import Response from './response.js';
import Request from './request.js';
import Router from './router.js';
import { removeDuplicateSlashes, supportedOptions, defaultSettings } from './utils.js';

class Application extends Router {
    constructor(settings = {}) {
        super(settings);
        this.port = undefined;
        for(const key in defaultSettings) {
            if(!this.settings[key]) {
                if(typeof defaultSettings[key] === 'function') {
                    this.settings[key] = defaultSettings[key]();
                } else {
                    this.settings[key] = defaultSettings[key];
                }
            }
        }
    }

    set(key, value) {
        if(supportedOptions.includes(key)) {
            this.settings[key] = value;
        } else {
            throw new Error(`Unsupported option: ${key}`);
        }
        return this;
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
            const response = new Response(res, req, this);
            request.res = response;
            response.req = request;

            let matchedRoute = await this._routeRequest(request, response);

            if(!matchedRoute && !res.aborted && !response.headersSent) {
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