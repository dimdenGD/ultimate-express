const http = require('http');
const uWS = require('uWebSockets.js');
const supertest = require('supertest');

async function asyncListen(app, port) {
    return new Promise((resolve, reject) => {
        app.listen(port, (token) => {
            if (!token) {
                reject(new Error('Failed to start uWS.js app'));
            }
            resolve(token);
        });
    });
}

/**
 * Bridge function that adapts uWebSockets.js app to Supertest.
 */
function uwsToSupertest(app) {
    const uwsApp = app.uwsApp ? app.uwsApp : app;

    const handler = async (req, res) => {
        let token;
        try {
            // Setup app to listen on a free port
            token = await asyncListen(uwsApp, 0);
            const port = uWS.us_socket_local_port(token);

            // Forward the request to the uWS app using HTTP request
            const options = {
                hostname: 'localhost',
                port: port,
                path: req.url,
                method: req.method,
                headers: req.headers,
            };

            const proxyReq = http.request(options, function (proxyRes) {
                res.writeHead(proxyRes.statusCode, proxyRes.headers);
                // Pipe the response data back to the original response
                proxyRes.pipe(res);

                // Close the uWS app when the response is done
                proxyRes.on('end', () => {
                    uWS.us_listen_socket_close(token);
                });
            });

            proxyReq.on('error', function (e) {
                throw e;
            });

            // Pipe the request body
            req.pipe(proxyReq);
        } catch (error) {
            console.error('Error in uWS supertest bridge: ', error);
            if (token) {
                uWS.us_listen_socket_close(token);
            }
            throw error;
        }
    };

    return handler;
}

const uWSSupertest = (app) => {
    return supertest(uwsToSupertest(app));
}

module.exports = uWSSupertest;