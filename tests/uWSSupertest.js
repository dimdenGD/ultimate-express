const uWS = require('uWebSockets.js');
const supertest = require('supertest');
class AppWrapper {
    constructor(app) {
        this.app = app.uwsApp ? app.uwsApp : app;
        this.token = null;
        this.port = null;
    }

    listen(port) {
        this.app.listen(port, (token) => {
            if (!token) {
                throw new Error('Failed to start uWS.js app');
            }
            this.token = token;
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
