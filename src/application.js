/*
Copyright 2024 dimden.dev

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

const uWS = require("uWebSockets.js");
const Router = require("./router.js");
const { removeDuplicateSlashes, defaultSettings, compileTrust, createETagGenerator, fastQueryParse, NullObject } = require("./utils.js");
const querystring = require("fast-querystring");
const ViewClass = require("./view.js");
const path = require("path");
const os = require("os");
const { Worker } = require("worker_threads");

const cpuCount = os.cpus().length;

let workers = [];
let taskKey = 0;
const workerTasks = new NullObject();

/**
 * Creates a new worker thread and sets up message handling.
 * @returns {Worker} The created worker thread.
 */
function createWorker() {
    const worker = new Worker(path.join(__dirname, 'worker.js'));
    workers.push(worker);

    worker.on('message', (message) => {
        if(message.err) {
            workerTasks[message.key].reject(new Error(message.err));
        } else {
            workerTasks[message.key].resolve(message.data);
        }
        delete workerTasks[message.key];
    });
    worker.unref();

    return worker;
}

/**
 * Represents the main application class, extending the Router.
 * Handles settings, workers, and request routing.
 */
class Application extends Router {
    /**
     * Initializes the application with the given settings.
     * @param {Object} [settings={}] - Application settings.
     */
    constructor(settings = new NullObject()) {
        super(settings);
        if(!settings?.uwsOptions) {
            settings.uwsOptions = {};
        }
        if(typeof settings.threads !== 'number') {
            settings.threads = cpuCount > 1 ? 1 : 0;
        }
        if(settings.uwsApp) {
            this.uwsApp = settings.uwsApp;
        } else if(settings.http3) {
            if(!settings.uwsOptions.key_file_name || !settings.uwsOptions.cert_file_name) {
                throw new Error('uwsOptions.key_file_name and uwsOptions.cert_file_name are required for HTTP/3');
            }
            this.uwsApp = uWS.H3App(settings.uwsOptions);
        } else if(settings.uwsOptions.key_file_name && settings.uwsOptions.cert_file_name) {
            this.uwsApp = uWS.SSLApp(settings.uwsOptions);
        } else {
            this.uwsApp = uWS.App(settings.uwsOptions);
        }
        this.ssl = settings.uwsOptions.key_file_name && settings.uwsOptions.cert_file_name;
        this.cache = new NullObject();
        this.engines = {};
        this.locals = {
            settings: this.settings
        };
        this.listenCalled = false;
        this.workers = [];
        for(let i = 0; i < settings.threads; i++) {
            if(workers[i]) {
                this.workers[i] = workers[i];
            } else {
                this.workers[i] = createWorker();
            }
        }
        this.port = undefined;
        for(const key in defaultSettings) {
            if(typeof this.settings[key] === 'undefined') {
                if(typeof defaultSettings[key] === 'function') {
                    this.settings[key] = defaultSettings[key](this);
                } else {
                    this.settings[key] = defaultSettings[key];
                }
            }
        }
        this.set('view', ViewClass);
        this.set('views', path.resolve('views'));
    }

    /**
     * Creates a task for a worker and returns its unique key.
     * @param {Function} resolve - The resolve function for the task's promise.
     * @param {Function} reject - The reject function for the task's promise.
     * @returns {number} The unique key for the task.
     */
    createWorkerTask(resolve, reject) {
        const key = taskKey++;
        workerTasks[key] = { resolve, reject };
        if(key > 1000000) {
            taskKey = 0;
        }
        return key;
    }

    /**
     * Reads a file using a worker thread.
     * @param {string} path - The file path to read.
     * @returns {Promise<string>} A promise that resolves with the file content.
     */
    readFileWithWorker(path) {
        return new Promise((resolve, reject) => {
            const worker = this.workers[Math.floor(Math.random() * this.workers.length)];
            const key = this.createWorkerTask(resolve, reject);
            worker.postMessage({ key, type: 'readFile', path });
        });
    }

    /**
     * Sets a configuration setting for the application.
     * @param {string} key - The setting key.
     * @param {*} value - The setting value.
     * @returns {Application} The application instance.
     */
    set(key, value) {
        if(key === 'trust proxy') {
            if(!value) {
                delete this.settings['trust proxy fn'];
            } else {
                this.settings['trust proxy fn'] = compileTrust(value);
            }
        } else if(key === 'query parser') {
            if(value === 'extended') {
                this.settings['query parser fn'] = fastQueryParse;
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

    /**
     * Enables a configuration setting.
     * @param {string} key - The setting key.
     * @returns {Application} The application instance.
     */
    enable(key) {
        this.set(key, true);
        return this;
    }

    /**
     * Disables a configuration setting.
     * @param {string} key - The setting key.
     * @returns {Application} The application instance.
     */
    disable(key) {
        this.set(key, false);
        return this;
    }

    /**
     * Checks if a configuration setting is enabled.
     * @param {string} key - The setting key.
     * @returns {boolean} True if the setting is enabled, false otherwise.
     */
    enabled(key) {
        return !!this.settings[key];
    }

    /**
     * Checks if a configuration setting is disabled.
     * @param {string} key - The setting key.
     * @returns {boolean} True if the setting is disabled, false otherwise.
     */
    disabled(key) {
        return !this.settings[key];
    }

    /**
     * Creates the request handler for the application.
     * Handles incoming requests and routes them to the appropriate handlers.
     * @private
     */
    #createRequestHandler() {
        this.uwsApp.any('/*', async (res, req) => {
            const { request, response } = this.handleRequest(res, req);

            const matchedRoute = await this._routeRequest(request, response);
            if(!matchedRoute && !response.headersSent && !response.aborted) {
                if(request._error) {
                    return this._handleError(request._error, null, request, response);
                }
                response.status(404);
                this._sendErrorPage(request, response, `Cannot ${request.method} ${request.path}`, false);
            }
        });
    }

    /**
     * Starts the application and listens on the specified port and host.
     * @param {number|string} port - The port number or Unix socket path.
     * @param {string} [host] - The host address.
     * @param {Function} [callback] - The callback function to execute after starting.
     * @returns {uWS.App} The uWS application instance.
     */
    listen(port, host, callback) {
        this.#createRequestHandler();
        // support listen(callback)
        if(!callback && typeof port === 'function') {
            callback = port;
            port = 0;
        }
        // support listen(port, callback)
        if(typeof host === 'function') {
            callback = host;
            host = undefined;
        }
        const onListen = socket => {
            if(!socket) {
                let err = new Error('Failed to listen on port ' + port + '. No permission or address already in use.');
                throw err;
            }
            this.port = uWS.us_socket_local_port(socket);
            if(callback) callback(this.port);
        };
        let fn = 'listen';
        let args = [];
        if(typeof port !== 'number') {
            if(!isNaN(Number(port))) {
                port = Number(port);
                args.push(port, onListen);
                if(host) {
                    args.unshift(host);
                }
            } else {
                fn = 'listen_unix';
                args.push(onListen, port);
            }
        } else {
            args.push(port, onListen);
            if(host) {
                args.unshift(host);
            }
        }
        this.listenCalled = true;
        this.uwsApp[fn](...args);
        return this.uwsApp;
    }

    /**
     * Returns the address information of the application.
     * @returns {Object} An object containing the port number.
     */
    address() {
        return { port: this.port };
    }

    /**
     * Returns the full path of the application, including parent mount paths.
     * @returns {string} The full application path.
     */
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

    /**
     * Registers a template engine for rendering views.
     * @param {string} ext - The file extension for the engine.
     * @param {Function} fn - The engine function.
     * @returns {Application} The application instance.
     * @throws {Error} If the engine function is not provided.
     */
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

    /**
     * Renders a view using the registered template engine.
     * @param {string} name - The name of the view to render.
     * @param {Object} [options] - The options for rendering the view.
     * @param {Function} callback - The callback function to execute after rendering.
     */
    render(name, options, callback) {
        if(typeof options === 'function') {
            callback = options;
            options = new NullObject();
        }
        if(!options) {
            options = new NullObject();
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
                engines: {...this.engines}
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

/**
 * Creates a new application instance with the given options.
 * @param {Object} options - The application options.
 * @returns {Application} The application instance.
 */
module.exports = function(options) {
    return new Application(options);
}
