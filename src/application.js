import uWS from 'uWebSockets.js';
import Response from './response.js';
import Request from './request.js';
import Router from './router.js';

class Application extends Router {
    #app;
    constructor(options = {}) {
        super();
        this.#app = uWS.App(options);
    }

    #createRequestHandler() {
        this.#app.get('/*', async (res, req) => {
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
        this.#app.listen(port, callback);
    }
}

export default function(options) {
    return new Application(options);
}