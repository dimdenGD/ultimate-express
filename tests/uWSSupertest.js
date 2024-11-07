const uWS = require('uWebSockets.js');
const supertest = require('supertest');
class AppWrapper {
    constructor(app) {
        // Get uws instance from ultimate or hyper express or plain uws
        this.app = app.uwsApp || app.uws_instance || app;
        this.token = null;
        this.port = null;
    }

    listen(port) {
        this.app.listen(port, (token) => {
            if (!token) {
                throw new Error('Failed to start uWS.js app');
            }
            this.token = token;
            // This cb is invoked immediately so we can assume the port is stored
            this.port = uWS.us_socket_local_port(token);
        });

        return {
            _handle: true,
            close: this.close.bind(this),
        }
    }

    close(fn) {
        if (this.token) {
            uWS.us_listen_socket_close(this.token);
            this.token = null;
            this.port = null;
        }
        fn?.();
    }

    address() {
        return this.port ? { port: this.port } : null;
    }
}

function uWSSupertest(app) {
    return supertest(new AppWrapper(app))
}

module.exports = uWSSupertest;