const uWS = require("uWebSockets.js");
const Router = require("./router.js");
const { removeDuplicateSlashes, defaultSettings, compileTrust, createETagGenerator } = require("./utils.js");
const querystring = require("querystring");
const qs = require("qs");
const ViewClass = require("./view.js");
const path = require("path");
const os = require("os");
const { Worker } = require("worker_threads");

const cpuCount = os.cpus().length;

let fsWorkers = [];
let fsKey = 0;
const fsCache = {};

function createFsWorker() {
    const fsWorker = new Worker(path.join(__dirname, 'workers/fs.js'));
    fsWorkers.push(fsWorker);

    fsWorker.on('message', (message) => {
        if(message.err) {
            fsCache[message.key].reject(new Error(message.err));
        } else {
            fsCache[message.key].resolve(message.data);
        }
        delete fsCache[message.key];
    });
    fsWorker.unref();

    return fsWorker;
}

class Application extends Router {
    constructor(settings = {}) {
        super(settings);
        if(!settings?.uwsOptions) {
            settings.uwsOptions = {};
        }
        if(typeof settings.fsThreads !== 'number') {
            settings.fsThreads = cpuCount > 1 ? 1 : 0;
        }
        if(settings.uwsOptions.key_file_name && settings.uwsOptions.cert_file_name) {
            this.uwsApp = uWS.SSLApp(settings.uwsOptions);
            this.ssl = true;
        } else {
            this.uwsApp = uWS.App(settings.uwsOptions);
            this.ssl = false;
        }
        this.cache = {};
        this.engines = {};
        this.locals = {
            settings: this.settings
        };
        this.fsWorkers = [];
        for(let i = 0; i < settings.fsThreads; i++) {
            if(fsWorkers[i]) {
                this.fsWorkers[i] = fsWorkers[i];
            } else {
                this.fsWorkers[i] = createFsWorker();
            }
        }
        this.port = undefined;
        for(const key in defaultSettings) {
            if(typeof this.settings[key] === 'undefined') {
                if(typeof defaultSettings[key] === 'function') {
                    this.settings[key] = defaultSettings[key]();
                } else {
                    this.settings[key] = defaultSettings[key];
                }
            }
        }
        this.set('view', ViewClass);
        this.set('views', path.resolve('views'));
    }

    readFileWithWorker(path) {
        return new Promise((resolve, reject) => {
            const fsWorker = this.fsWorkers[Math.floor(Math.random() * this.fsWorkers.length)];
            const key = fsKey++;
            fsWorker.postMessage({ key, type: 'readFile', path });
            fsCache[key] = { resolve, reject };
            if(key > 1000000) {
                fsKey = 0;
            }
        });
    }


    set(key, value) {
        if(key === 'trust proxy') {
            if(!value) {
                delete this.settings['trust proxy fn'];
            } else {
                this.settings['trust proxy fn'] = compileTrust(value);
            }
        } else if(key === 'query parser') {
            if(value === 'extended') {
                this.settings['query parser fn'] = qs.parse;
            } else if(value === 'simple') {
                this.settings['query parser fn'] = querystring.parse;
            } else if(typeof value === 'function') {
                this.settings['query parser fn'] = value;
            } else {
                this.settings['query parser fn'] = undefined;
            }
        } else if(key === 'env') {
            if(value === 'production') {
                this.settings['view cache'] = true;
            } else {
                this.settings['view cache'] = undefined;
            }
        } else if(key === 'views') {
            this.settings[key] = path.resolve(value);
            return this;
        } else if(key === 'etag') {
            if(typeof value === 'function') {
                this.settings['etag fn'] = value;
            } else {
                switch(value) {
                    case true:
                    case 'weak':
                        this.settings['etag fn'] = createETagGenerator({ weak: true });
                        break;
                    case 'strong':
                        this.settings['etag fn'] = createETagGenerator({ weak: false });
                        break;
                    case false:
                        delete this.settings['etag fn'];
                        break;
                    default:
                        throw new Error(`Invalid etag mode: ${value}`);
                }
            }
        }

        this.settings[key] = value;
        return this;
    }

    enable(key) {
        this.settings[key] = true;
        return this;
    }

    disable(key) {
        this.settings[key] = false;
        return this;
    }

    enabled(key) {
        return !!this.settings[key];
    }

    disabled(key) {
        return !this.settings[key];
    }

    #createRequestHandler() {
        this.uwsApp.any('/*', async (res, req) => {

            const request = new this._request(req, res, this);
            const response = new this._response(res, request, this);
            request.res = response;
            response.req = request;
            res.onAborted(() => {
                const err = new Error('Request aborted');
                err.code = 'ECONNABORTED';
                response.aborted = true;
                response.socket.emit('error', err);
            });

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
        let fn = 'listen';
        if(typeof port !== 'number') {
            if(!isNaN(Number(port))) {
                port = Number(port);
            } else {
                fn = 'listen_unix';
            }
        }
        this.uwsApp[fn](port, socket => {
            if(!socket) {
                let err = new Error('Failed to listen on port ' + port + '. No permission or address already in use.');
                throw err;
            }
            this.port = uWS.us_socket_local_port(socket);
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

    engine(ext, fn) {
        if (typeof fn !== 'function') {
            throw new Error('callback function required');
        }
        const extension = ext[0] !== '.'
            ? '.' + ext
            : ext;
        this.engines[extension] = fn;
        return this;
    }

    render(name, options, callback) {
        if(typeof options === 'function') {
            callback = options;
            options = {};
        }
        if(!options) {
            options = {};
        } else {
            options = Object.assign({}, options);
        }
        for(let key in this.locals) {
            options[key] = this.locals[key];
        }

        if(options._locals) {
            for(let key in options._locals) {
                options[key] = options._locals[key];
            }
        }

        if(options.cache == null) {
            options.cache = this.enabled('view cache');
        }

        let view;
        if(options.cache) {
            view = this.cache[name];
        }

        if(!view) {
            const View = this.get('view');
            view = new View(name, {
                defaultEngine: this.get('view engine'),
                root: this.get('views'),
                engines: this.engines
            });
            if(!view.path) {
                const dirs = Array.isArray(view.root) && view.root.length > 1
                    ? 'directories "' + view.root.slice(0, -1).join('", "') + '" or "' + view.root[view.root.length - 1] + '"'
                    : 'directory "' + view.root + '"';

                const err = new Error(`Failed to lookup view "${name}" in views ${dirs}`);
                err.view = view;
                return callback(err);
            }

            if(options.cache) {
                this.cache[name] = view;
            }
        }

        try {
            view.render(options, callback);
        } catch(err) {
            callback(err);
        }
    }
}

module.exports = function(options) {
    return new Application(options);
}