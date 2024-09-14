import cookie from 'cookie';
import mime from 'mime-types';
import vary from 'vary';
import { normalizeType, stringify } from './utils.js';
import { PassThrough } from 'stream';
import { isAbsolute } from 'path';
import fs from 'fs';
import { join as pathJoin, resolve as pathResolve } from 'path';
import { Worker } from 'worker_threads';

let fsKey = 0;
const fsCache = {};
const fsWorker = new Worker('./src/workers/fs.js');

fsWorker.on('message', (message) => {
    if(message.err) {
        fsCache[message.key].reject(new Error(message.err));
    } else {
        fsCache[message.key].resolve(message.data);
    }
    delete fsCache[message.key];
});

function readFile(path) {
    return new Promise((resolve, reject) => {
        const key = fsKey++;
        fsWorker.postMessage({ key, type: 'readFile', path });
        fsCache[key] = { resolve, reject };
    });
}

setInterval(() => {
    if(fsKey > 100000) fsKey = 0;
}, 60000);

export default class Response extends PassThrough {
    constructor(res, req, app) {
        super();
        this._res = res;
        this._req = req;
        this.app = app;
        this.headersSent = false;
        this.statusCode = 200;
        this.headers = {
            'content-type': 'text/html',
            'keep-alive': 'timeout=10'
        };
        this.body = undefined;
        this.streaming = false;

        this.on('data', (chunk) => {
            this.streaming = true;
            if(this._res.aborted) {
                const err = new Error('Request aborted');
                err.code = 'ECONNABORTED';
                return this.destroy(err);
            }
            this.pause();
            this._res.cork(() => {
                if(!this.headersSent) {
                    this._res.writeStatus(this.statusCode.toString());
                    for(const h of Object.entries(this.headers)) {
                        this._res.writeHeader(h[0], h[1]);
                    }
                    this.headersSent = true;
                }
                const ab = chunk.buffer.slice(chunk.byteOffset, chunk.byteOffset + chunk.byteLength);
                this._res.write(ab);
                this.resume();
            });
        });
        this.on('error', (err) => {
            this._res.cork(() => {
                this._res.end();
            });
        });
    }
    status(code) {
        if(this.headersSent) {
            throw new Error('Can\'t set status: Response was already sent');
        }
        this.statusCode = parseInt(code);
        return this;
    }
    sendStatus(code) {
        return this.status(code).send(code.toString());
    }
    end() {
        if(this.streaming && !this._res.aborted) {
            this._res.cork(() => {
                this._res.end();
            });
            return;
        }
        if(this._res.aborted || this.headersSent) {
            return;
        }
        this._res.cork(() => {
            this._res.writeStatus(this.statusCode.toString());
            for(const h of Object.entries(this.headers)) {
                this._res.writeHeader(h[0], h[1]);
            }
            this.headersSent = true;
            if(this.body !== undefined) {
                this._res.end(this.body);
            } else {
                this._res.end();
            }
        });
    }
    send(body) {
        if(this.headersSent) {
            throw new Error('Can\'t write body: Response was already sent');
        }
        if(Buffer.isBuffer(body)) {
            body = body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength);
        } else if(body === null || body === undefined) {
            body = '';
        } else if(typeof body === 'object') {
            body = JSON.stringify(body);
        } else if(typeof body === 'number') {
            if(arguments[1]) {
                console.warn(new Error("express deprecated res.send(status, body): Use res.status(status).send(body) instead"));
                this.body = arguments[1];
            } else {
                console.warn(new Error("express deprecated res.send(status): Use res.sendStatus(status) instead"));
            }
            return this.status(body).end();
        } else {
            body = String(body);
        }
        this.body = body;
        this.end();
    }
    sendFile(path, options = {}, callback) {
        // TODO: support options
        // TODO: support Range
        if(!path) {
            throw new TypeError('path argument is required to res.sendFile');
        }
        if(typeof path !== 'string') {
            throw new TypeError('path argument is required to res.sendFile');
        }
        if(typeof options === 'function') {
            callback = options;
            options = {};
        }
        if(!options) options = {};
        if(!options.root && !isAbsolute(path)) {
            throw new TypeError('path must be absolute or specify root to res.sendFile');
        }
        const fullpath = options.root ? pathResolve(pathJoin(options.root, path)) : path;
        if(options.root && !fullpath.startsWith(pathResolve(options.root))) {
            throw new Error('Forbidden');
        }
        const stat = fs.statSync(fullpath);
        if(stat.isDirectory()) {
            return this.status(404).send(this.app._generateErrorPage(`Cannot ${this.req.method} ${this.req.path}`));
        }

        //there's no point in creating a stream when the file is small enough to fit in a single chunk
        if(stat.size < 64 * 1024) { // 64kb - default highWaterMark
            // get file using worker
            readFile(fullpath).then((data) => {
                if(this._res.aborted) {
                    return;
                }
                this._res.cork(() => {
                    this._res.writeStatus(this.statusCode.toString());
                    for(const h of Object.entries(this.headers)) {
                        this._res.writeHeader(h[0], h[1]);
                    }
                    this.headersSent = true;
                    this._res.end(data);
                });
            }).catch((err) => {
                this.status(500).send(this.app._generateErrorPage(err.message));
            });
        } else {
            const file = fs.createReadStream(fullpath);
            pipeStreamOverResponse(this, file, stat.size, callback);
        }
    }
    set(field, value) {
        if(this.headersSent) {
            throw new Error('Can\'t write headers: Response was already sent');
        }
        if(typeof field === 'object') {
            for(const v of Object.entries(field)) {
                this.set(v[0].toLowerCase(), v[1]);
            }
        } else {
            this.headers[field.toLowerCase()] = String(value);
        }
        return this;
    }
    header(field, value) {
        return this.set(field, value);
    }
    setHeader(field, value) {
        return this.set(field, value);
    }
    get(field) {
        return this.headers[field.toLowerCase()];
    }
    getHeader(field) {
        return this.get(field);
    }
    removeHeader(field) {
        delete this.headers[field.toLowerCase()];
        return this;
    }
    append(field, value) {
        field = field.toLowerCase();
        if(this.headers[field]) {
            if(typeof value === 'string' || typeof value === 'number') {
                this.headers[field] += ', ' + value;
            } else if(Array.isArray(value)) {
                this.headers[field] += ', ' + value.join(', ');
            }
        } else {
            if(typeof value === 'string' || typeof value === 'number') {
                this.headers[field] = value.toString();
            } else if(Array.isArray(value)) {
                this.headers[field] = value.join(', ');
            }
        }
        return this;
    }
    cookie(name, value, options) {
        if(!options) {
            options = {};
        }
        // TODO: signed cookies
        const val = typeof value === 'object' ? "j:"+JSON.stringify(value) : String(value);
        if(options.maxAge != null) {
            const maxAge = options.maxAge - 0;
            if(!isNaN(maxAge)) {
                options.expires = new Date(Date.now() + maxAge);
                options.maxAge = Math.floor(maxAge / 1000);
            }
        }

        if(options.path == null) {
            options.path = '/';
        }

        this.append('Set-Cookie', cookie.serialize(name, val, options));
        return this;
    }
    clearCookie(name, options) {
        const opts = { path: '/', ...options, expires: new Date(1) };
        delete opts.maxAge;
        return this.cookie(name, '', opts);
    }
    attachment(filename) {
        this.set('Content-Disposition', `attachment; filename="${filename}"`);
        this.type(filename.split('.').pop());
        return this;
    }
    format(object) {
        const keys = Object.keys(object).filter(v => v !== 'default');
        const key = keys.length > 0 ? this.req.accepts(keys) : false;

        this.vary('Accept');

        if(key) {
            this.set('Content-Type', normalizeType(key).value);
            object[key](this.req, this, this.req.next);
        } else if(object.default) {
            object.default(this.req, this, this.req.next);
        } else {
            this.status(406).send(this.app._generateErrorPage('Not Acceptable'));
        }

        return this;
    }
    json(body) {
        if(!this.get('Content-Type')) {
            this.set('Content-Type', 'application/json');
        }
        // TODO: support json options
        this.send(JSON.stringify(body));
    }
    jsonp(object) {
        let callback = this.req.query[this.app.settings['jsonp callback name']];
        // TODO: support json options
        let body = stringify(object);

        if(!this.get('Content-Type')) {
            this.set('Content-Type', 'application/javascript');
            this.set('X-Content-Type-Options', 'nosniff');
        }

        if(Array.isArray(callback)) {
            callback = callback[0];
        }

        if(typeof callback === 'string' && callback.length !== 0) {
            this.set('Content-Type', 'application/javascript');
            this.set('X-Content-Type-Options', 'nosniff');
            callback = callback.replace(/[^\[\]\w$.]/g, '');

            if(body === undefined) {
                body = '';
            } else if(typeof body === 'string') {
                // replace chars not allowed in JavaScript that are in JSON
                body = body
                    .replace(/\u2028/g, '\\u2028')
                    .replace(/\u2029/g, '\\u2029')
            }
            body = '/**/ typeof ' + callback + ' === \'function\' && ' + callback + '(' + body + ');';
        }

        return this.send(body);
    }
    links(links) {
        this.set('Link', Object.entries(links).map(([rel, url]) => `<${url}>; rel="${rel}"`).join(', '));
        return this;
    }
    location(path) {
        if(path === 'back') {
            path = this.req.get('Referrer');
            if(!path) path = this.req.get('Referer');
            if(!path) path = '/';
        }
        return this.set('Location', encodeURI(path));
    }
    redirect(status, url) {
        if(typeof status !== 'number' && !url) {
            url = status;
            status = 302;
        }
        this.location(url);
        this.status(status);
        this.set('Content-Type', 'text/plain');
        return this.send(`Redirecting to ${url}`);
    }

    type(type) {
        const ct = type.indexOf('/') === -1
            ? (mime.contentType(type) || 'application/octet-stream')
            : type;
        return this.set('Content-Type', ct);
    }
    contentType(type) {
        return this.type(type);
    }

    vary(field) {
        vary(this, field);
        return this;
    }
}

function pipeStreamOverResponse(res, readStream, totalSize, callback) {
    readStream.on('data', (chunk) => {
        if(res._res.aborted) {
            const err = new Error("Request aborted");
            err.code = "ECONNABORTED";
            return readStream.destroy(err);
        }
        res._res.cork(() => {
            if(!res.headersSent) {
                res._res.writeStatus(res.statusCode.toString());
                for(const h of Object.entries(res.headers)) {
                    res._res.writeHeader(h[0], h[1]);
                }
                res.headersSent = true;
            }
            const ab = chunk.buffer.slice(chunk.byteOffset, chunk.byteOffset + chunk.byteLength);
        
            const lastOffset = res._res.getWriteOffset();
            const [ok, done] = res._res.tryEnd(ab, totalSize);
      
            if (done) {
                readStream.destroy();
                res._res.done = true;
                if(callback) callback();
            } else if (!ok) {
                readStream.pause();
        
                res._res.ab = ab;
                res._res.abOffset = lastOffset;
        
                res._res.onWritable((offset) => {  
                    const [ok, done] = res._res.tryEnd(res._res.ab.slice(offset - res._res.abOffset), totalSize);
                    if (done) {
                        readStream.destroy();
                        res._res.done = true;
                        if(callback) callback();
                    } else if (ok) {
                        readStream.resume();
                    }
            
                    return ok;
                });
            }
        });
    }).on('error', e => {
        if(callback) callback(e);
        if(!res._res.done && !res._res.aborted) {
            res._res.close();
        }
    });
  }
  