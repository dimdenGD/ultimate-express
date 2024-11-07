const http = require('http');
const uWS = require('uWebSockets.js');
const supertest = require('supertest');

function findFreePortSync() {
    const app = http.createServer();
    app.listen(0);
    const port = app.address().port;
    app.close();
    return port;
}
class AppWrapper {
    constructor(app) {
        this.app = app.uwsApp ? app.uwsApp : app;
        this.token = null;
        this.port = null;
    }

    listen(_port) {


        // const port = _port === 0 ? findFreePortSync() : port;

        this.app.listen(0, (token) => {
            if (!token) {
                throw new Error('Failed to start uWS.js app');
            }
            this.token = token;
            this.port = uWS.us_socket_local_port(token);
            console.log('cb token:', this.port);
        });

        return { 
            _handle: true,
            close(fn) {
            if (this.token) {
                uWS.us_listen_socket_close(this.token);
                this.token = null;
                this.port = null;
            }
            fn?.();
        }
    }
    }

    address() {
        return this.port ? { port: this.port } : null;
    }
}

function uWSSupertest(app) {
    const _app = new AppWrapper(app);
    return supertest(_app)
}

module.exports = uWSSupertest;
