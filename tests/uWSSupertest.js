const net = require('net');
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

async function findFreePort(startPort = 10000) {
    let port = startPort;

    while (true) {
        const isAvailable = await isPortAvailable(port);
        if (isAvailable) return port;
        port++;
    }
}

function isPortAvailable(port) {
    return new Promise((resolve) => {
        const server = net.createServer();

        server.once('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                resolve(false); // Port is in use
            } else {
                resolve(false); // Some other error
            }
        });

        server.once('listening', () => {
            server.close();
            resolve(true); // Port is available
        });

        server.listen(port);
    });
}

/**
 * Converts an HTTP request to a URL, including the port and original request URL.
 */
function httpReqToUrl(req, port) {
    return `http://localhost:${port}${req.url}`;
}

/**
 * Converts an HTTP request to fetch options, including method, headers, and body.
 */
function httpReqToFetchOptions(req) {
    const headers = { ...req.headers };
    delete headers['host']; // Remove 'host' header since we're specifying the URL with the port

    const options = {
        method: req.method,
        headers,
        // For non-GET/HEAD requests, include the request body as a stream
        body: (req.method !== 'GET' && req.method !== 'HEAD') ? req : undefined,
    };

    // Include 'duplex' option when sending a body
    if (options.body) {
        options.duplex = 'half';
    }

    return options;
}

/**
 * Writes the fetch response back to the HTTP response object.
 */
async function fetchResponseToHttpRes(response, res) {
    res.statusCode = response.status;
    for (const [key, value] of response.headers.entries()) {
        res.setHeader(key, value);
    }
    if (!response.body) {
        res.end();
        return;
    }
    
    const chunks = [];
    for await (const chunk of response.body) {
        chunks.push(chunk);
    }
    res.write(Buffer.concat(chunks));
    res.end();
}

/**
 * Bridge function that adapts uWebSockets.js app to Supertest.
 */
function uwsToSupertest(app) {
    const handler = async (req, res) => {
        try {
            const uwsApp = app.uwsApp ? app.uwsApp : app;
            // Setup app to listen on a free port
            const port = await findFreePort();
            const token = await asyncListen(uwsApp, port);

            // Forward the request to the uWS app
            const url = httpReqToUrl(req, port);
            const options = httpReqToFetchOptions(req);

            // Fetch the response from the uWS app
            const response = await fetch(url, options);
            await fetchResponseToHttpRes(response, res);

            // Close the uWS app
            uWS.us_listen_socket_close(token);
        } catch (error) {
            console.error('Error in uWS supertest bridge: ', error);
        }
    };

    return handler;
}

const uWSSupertest = (app) => {
    return supertest(uwsToSupertest(app));
}

module.exports = uWSSupertest;
