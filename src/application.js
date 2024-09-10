import uWS from 'uWebSockets.js';
import Response from './response.js';
import Request from './request.js';
import Router from './router.js';

class Application extends Router {
    constructor(options = {}) {
        super();
        this.uwsApp = uWS.App(options);
        this.port = undefined;
        this.options = options;
    }

    set(key, value) {
        this.options[key] = value;
        return this;
    }

    get(key, ...args) {
        if(typeof key === 'string' && args.length === 0) {
            return this.options[key];
        }
        return super.get(key, ...args);
    }

    #createRequestHandler() {
        this.uwsApp.any('/*', async (res, req) => {
            res.onAborted(() => {
                res.aborted = true;
            });

            const request = new Request(req);
            const response = new Response(res);
            let matchedRoute = await this._routeRequest(request, response);

            if(!matchedRoute && !res.aborted) {
                response.status(404);
                response.send(
                    '<!DOCTYPE html>\n' +
                    '<html lang="en">\n' +
                    '<head>\n' +
                    '<meta charset="utf-8">\n' +
                    '<title>Error</title>\n' +
                    '</head>\n' +
                    '<body>\n' +
                    `<pre>Cannot ${request.method} ${request.path}</pre>\n` +
                    '</body>\n' +
                    '</html>\n'
                );
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

    path() {
        return this.fullmountpath === '/' ? '' : this.fullmountpath;
    }
}

export default function(options) {
    return new Application(options);
}