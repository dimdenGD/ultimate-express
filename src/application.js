import uWS from 'uWebSockets.js';
import Response from './response.js';
import Request from './request.js';
import Router from './router.js';

class Application extends Router {
    constructor(options = {}) {
        super();
        this.uwsApp = uWS.App(options);
        this.port = undefined;
    }

    #createRequestHandler() {
        this.uwsApp.get('/*', async (res, req) => {
            const request = new Request(req);
            const response = new Response(this, request, res);
            let matchedRoute = await this.route(request, response);

            if(!matchedRoute) {
                response.status(404);
                response.set('Content-Type', 'text/html');
                response.send(
                    '<!DOCTYPE html>\n' +
                    '<html lang="en">\n' +
                    '<head>\n' +
                    '<meta charset="utf-8">\n' +
                    '<title>Error</title>\n' +
                    '</head>\n' +
                    '<body>\n' +
                    `<pre>Cannot GET ${req.getUrl()}</pre>\n` +
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
}

export default function(options) {
    return new Application(options);
}