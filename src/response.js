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

const cookie = require("cookie");
const mime = require("mime-types");
const vary = require("vary");
const encodeUrl = require("encodeurl");
const { 
    normalizeType, stringify, deprecated, UP_PATH_REGEXP, decode,
    containsDotFile, isPreconditionFailure, isRangeFresh, NullObject
} = require("./utils.js");
const { Writable } = require("stream");
const { isAbsolute } = require("path");
const fs = require("fs");
const Path = require("path");
const statuses = require("statuses");
const { sign } = require("cookie-signature");
// events is faster at init, tseep is faster at sending events
// since we create a ton of objects and dont send a ton of events, its better to use events here
const { EventEmitter } = require("events");
const http = require("http");
const ms = require('ms');   
const etag = require("etag");

const outgoingMessage = new http.OutgoingMessage();
const symbols = Object.getOwnPropertySymbols(outgoingMessage);
const kOutHeaders = symbols.find(s => s.toString() === 'Symbol(kOutHeaders)');

class Socket extends EventEmitter {
    constructor(response) {
        super();
        this.response = response;

        this.on('error', (err) => {
            this.emit('close');
        });
    }
    get writable() {
        return !this.response.finished;
    }

    end(body) {
        this.response.end(body);
    }

    close() {
        if(this.response.finished) {
            return;
        }
        this.response.finished = true;
        this.emit('close');
        this.response._res.close();
    }
}

module.exports = class Response extends Writable {
    #socket = null;
    constructor(res, req, app) {
        super();
        this._req = req;
        this._res = res;
        this.headersSent = false;
        this.app = app;
        this.locals = new NullObject();
        this.finished = false;
        this.aborted = false;
        this.statusCode = 200;
        this.chunkedTransfer = true;
        this.totalSize = 0;
        this.headers = {
            'connection': 'keep-alive',
            'keep-alive': 'timeout=10'
        };
        if(this.app.get('x-powered-by')) {
            this.headers['x-powered-by'] = 'UltimateExpress';
        }

        // support for node internal
        this[kOutHeaders] = new Proxy(this.headers, {
            set: (obj, prop, value) => {
                this.set(prop, value[1]);
                return true;
            },
            get: (obj, prop) => {
                return obj[prop];
            }
        });
        this.body = undefined;
        this.on('error', (err) => {
            if(this.finished) {
                return;
            }
            this._res.cork(() => {
                this._res.close();
                this.finished = true;
                if(this.socketExists) this.socket.emit('close');
            });
        });
    }

    get socket() {
        this.socketExists = true;
        if(!this.#socket) {
            this.#socket = new Socket(this);
        }
        return this.#socket;
    }

    _write(chunk, encoding, callback) {
        if(this.aborted) {
            const err = new Error('Request aborted');
            err.code = 'ECONNABORTED';
            return this.destroy(err);
        }
        if(this.finished) {
            const err = new Error('Response already finished');
            return this.destroy(err);
        }
        this._res.cork(() => {
            if(!this.headersSent) {
                this.writeHead(this.statusCode);
                this._res.writeStatus(this.statusCode.toString());
                this.writeHeaders(typeof chunk === 'string');
            }
            if(!Buffer.isBuffer(chunk) && !(chunk instanceof ArrayBuffer)) {
                chunk = Buffer.from(chunk);
                chunk = chunk.buffer.slice(chunk.byteOffset, chunk.byteOffset + chunk.byteLength);
            }
            if(this.chunkedTransfer) {
                // chunked transfer encoding
                this._res.write(chunk);
                callback();
            } else {
                // fixed size transfer encoding
                const lastOffset = this._res.getWriteOffset();
                const [ok, done] = this._res.tryEnd(chunk, this.totalSize);
                if(done) {
                    this.destroy();
                    this.finished = true;
                    if(this.socketExists) this.socket.emit('close');
                    callback();
                } else {
                    // still writing
                    if(!ok) {
                        // wait until uWS is ready to accept more data
                        this._res.onWritable((offset) => {
                            if(this.finished) {
                                return true;
                            }
                            const [ok, done] = this._res.tryEnd(chunk.slice(offset - lastOffset), this.totalSize);
                            if(done) {
                                this.destroy();
                                this.finished = true;
                                if(this.socketExists) this.socket.emit('close');
                                callback();
                            } else if(ok) {
                                callback();
                            }
                            
                            return ok;
                        });
                    } else {
                        callback();
                    }
                }
            }
        });
    }
    writeHead(statusCode, statusMessage, headers) {
        this.statusCode = statusCode;
        if(!headers) {
            if(!statusMessage) return;
            headers = statusMessage;
        }
        for(let header in headers) {
            this.set(header, headers[header]);
        }
    }
    writeHeaders(utf8) {
        for(const header in this.headers) {
            const value = this.headers[header];
            if(header === 'content-length') {
                // if content-length is set, disable chunked transfer encoding, since size is known
                this.chunkedTransfer = false;
                this.totalSize = parseInt(value);
                continue;
            }
            if(Array.isArray(value)) {
                for(let val of value) {
                    this._res.writeHeader(header, val);
                }
            } else {
                this._res.writeHeader(header, value);
            }
        }
        if(!this.headers['content-type']) {
            this._res.writeHeader('content-type', 'text/html' + (utf8 ? `; charset=utf-8` : ''));
        }
        this.headersSent = true;
    }
    _implicitHeader() {
        // compatibility function
        // usually should send headers but this is useless for us
        this.writeHead(this.statusCode);
    }
    status(code) {
        this.statusCode = parseInt(code);
        return this;
    }
    sendStatus(code) {
        return this.status(code).send(statuses.message[+code] ?? code.toString());
    }
    end(data) {
        if(this.finished) {
            return;
        }
        this.writeHead(this.statusCode);
        this._res.cork(() => {
            if(!this.headersSent) {
                const etagFn = this.app.get('etag fn');
                if(etagFn && data && !this.headers['etag'] && !this.req.noEtag) {
                    this.headers['etag'] = etagFn(data);
                }
                const fresh = this.req.fresh;
                this._res.writeStatus(fresh ? '304' : this.statusCode.toString());
                this.writeHeaders(true);
                if(fresh) {
                    this._res.end();
                    this.finished = true;
                    if(this.socketExists) this.socket.emit('close');
                    return;
                }
            }
            const contentLength = this.headers['content-length'];
            if(!data && contentLength) {
                this._res.endWithoutBody(contentLength.toString());
            } else {
                if(data instanceof Buffer) {
                    data = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
                }
                if(this.req.method === 'HEAD') {
                    const length = Buffer.byteLength(data ?? '');
                    this._res.endWithoutBody(length.toString());
                } else {
                    this._res.end(data);
                }
            }
            this.finished = true;
            if(this.socketExists) this.socket.emit('close');
        });

        this.emit('finish')
        return this;
    }

    send(body) {
        if(this.headersSent) {
            throw new Error('Can\'t write body: Response was already sent');
        }
        const isBuffer = Buffer.isBuffer(body);
        if(body === null || body === undefined) {
            body = '';
        } else if(typeof body === 'object' && !isBuffer) {
            return this.json(body);
        } else if(typeof body === 'number') {
            if(arguments[1]) {
                deprecated('res.send(status, body)', 'res.status(status).send(body)');
                return this.status(body).send(arguments[1]);
            } else {
                deprecated('res.send(status)', 'res.sendStatus(status)');
                return this.sendStatus(body);
            }
        } else if(!isBuffer) {
            body = String(body);
        }
        if(typeof body === 'string') {
            const contentType = this.headers['content-type'];
            if(!contentType) {
                this.headers['content-type'] = 'text/html; charset=utf-8';
            } else if(!contentType.includes(';')) {
                this.headers['content-type'] += '; charset=utf-8';
            }
        }
        return this.end(body);
    }

    sendFile(path, options = new NullObject(), callback) {
        if(typeof path !== 'string') {
            throw new TypeError('path argument is required to res.sendFile');
        }
        if(typeof options === 'function') {
            callback = options;
            options = new NullObject();
        }
        if(!options) options = new NullObject();
        let done = callback;
        if(!done) done = this.req.next;
        // default options
        if(typeof options.maxAge === 'string') {
            options.maxAge = ms(options.maxAge);
        } else if(typeof options.maxAge === 'undefined') {
            options.maxAge = 0;
        }
        if(typeof options.lastModified === 'undefined') {
            options.lastModified = true;
        }
        if(typeof options.cacheControl === 'undefined') {
            options.cacheControl = true;
        }
        if(typeof options.acceptRanges === 'undefined') {
            options.acceptRanges = true;
        }
        if(typeof options.etag === 'undefined') {
            options.etag = this.app.get('etag') !== false;
        }
        let etagFn = this.app.get('etag fn');
        if(options.etag && !etagFn) {
            etagFn = stat => {
                return etag(stat, { weak: true });
            }
        }

        // path checks
        if(!options.root && !isAbsolute(path)) {
            this.status(500);
            return done(new Error('path must be absolute or specify root to res.sendFile'));
        }
        if(!options.skipEncodePath) {
            path = encodeURI(path);
        }
        path = decode(path);
        if(path === -1) {
            this.status(400);
            return done(new Error('Bad Request'));
        }
        if(~path.indexOf('\0')) {
            this.status(400);
            return done(new Error('Bad Request'));
        }
        if(UP_PATH_REGEXP.test(path)) {
            this.status(403);
            return done(new Error('Forbidden'));
        }
        const parts = Path.normalize(path).split(Path.sep);
        const fullpath = options.root ? Path.resolve(Path.join(options.root, path)) : path;
        if(options.root && !fullpath.startsWith(Path.resolve(options.root))) {
            this.status(403);
            return done(new Error('Forbidden'));
        }

        // dotfile checks
        if(containsDotFile(parts)) {
            switch(options.dotfiles) {
                case 'allow':
                    break;
                case 'deny':
                    this.status(403);
                    return done(new Error('Forbidden'));
                case 'ignore_files':
                    const len = parts.length;
                    if(len > 1 && parts[len - 1].startsWith('.')) {
                        this.status(404);
                        return done(new Error('Not found'));
                    }
                    break;
                case 'ignore':
                default:
                    this.status(404);
                    return done(new Error('Not found'));
            }
        }

        let stat = options._stat;
        if(!stat) {
            try {
                stat = fs.statSync(fullpath);
            } catch(err) {
                return done(err);
            }
            if(stat.isDirectory()) {
                this.status(404);
                return done(new Error(`Not found`));
            }
        }

        // headers
        if(!this.headers['content-type']) {
            const m = mime.lookup(fullpath);
            if(m) this.type(m);
            else this.type('application/octet-stream');
        }
        if(options.cacheControl) {
            this.headers['cache-control'] = `public, max-age=${options.maxAge / 1000}` + (options.immutable ? ', immutable' : '');
        }
        if(options.lastModified) {
            this.headers['last-modified'] = stat.mtime.toUTCString();
        }
        if(options.headers) {
            for(const header in options.headers) {
                this.set(header, options.headers[header]);
            }
        }
        if(options.setHeaders) {
            options.setHeaders(this, fullpath, stat);
        }

        // etag
        if(options.etag && etagFn && !this.headers['etag']) {
            this.headers['etag'] = etagFn(stat);
        }
        if(!options.etag) {
            this.req.noEtag = true;
        }

        // conditional requests
        if(isPreconditionFailure(this.req, this)) {
            this.status(412);
            return done(new Error('Precondition Failed'));
        }

        // range requests
        let offset = 0, len = stat.size, ranged = false;
        if(options.acceptRanges) {
            this.headers['accept-ranges'] = 'bytes';
            if(this.req.headers.range) {
                let ranges = this.req.range(stat.size, {
                    combine: true
                });
    
                // if-range
                if(!isRangeFresh(this.req, this)) {
                    ranges = -2;
                }
    
                if(ranges === -1) {
                    this.status(416);
                    this.headers['content-range'] = `bytes */${stat.size}`;
                    return done(new Error('Range Not Satisfiable'));
                }
                if(ranges !== -2 && ranges.length === 1) {
                    this.status(206);
                    const range = ranges[0];
                    this.headers['content-range'] = `bytes ${range.start}-${range.end}/${stat.size}`;
                    offset = range.start;
                    len = range.end - range.start + 1;
                    ranged = true;
                }
            }
        }

        // if-modified-since, if-none-match
        if(this.req.fresh) {
            return this.end();
        }

        if(this.req.method === 'HEAD') {
            this.set('Content-Length', stat.size);
            return this.end();
        }

        // serve smaller files using workers
        if(this.app.workers.length && stat.size < 768 * 1024 && !ranged) {
            this.app.readFileWithWorker(fullpath).then((data) => {
                if(this._res.finished) {
                    return;
                }
                this.end(data);
                if(callback) callback();
            }).catch((err) => {
                if(callback) callback(err);
            });
        } else {
            // larger files or range requests are piped over response
            let opts = {
                highWaterMark: 256 * 1024
            };
            if(ranged) {
                opts.start = offset;
                opts.end = Math.max(offset, offset + len - 1);
            }
            const file = fs.createReadStream(fullpath, opts);
            pipeStreamOverResponse(this, file, len, callback);
        }
    }
    download(path, filename, options, callback) {
        let done = callback;
        let name = filename;
        let opts = options || new NullObject();

        // support function as second or third arg
        if (typeof filename === 'function') {
            done = filename;
            name = null;
            opts = {};
        } else if (typeof options === 'function') {
            done = options;
            opts = {};
        }

        // support optional filename, where options may be in it's place
        if (typeof filename === 'object' &&
            (typeof options === 'function' || options === undefined)) {
            name = null;
            opts = filename;
        }
        if(!name) {
            name = Path.basename(path);
        }
        if(!opts.root && !isAbsolute(path)) {
            opts.root = process.cwd();
        }

        this.attachment(name);
        this.sendFile(path, opts, done);
    }
    set(field, value) {
        if(this.headersSent) {
            throw new Error('Cannot set headers after they are sent to the client');
        }
        if(typeof field === 'object') {
            for(const header in field) {
                this.set(header, field[header]);
            }
        } else {
            field = field.toLowerCase();
            if(field === 'set-cookie' && Array.isArray(value)) {
                value = value.join('; ');
            } else if(field === 'content-type') {
                if(!value.includes('charset=') && (value.startsWith('text/') || value === 'application/json' || value === 'application/javascript')) {
                    value += '; charset=utf-8';
                }
            }
            this.headers[field] = String(value);
        }
        return this;
    }
    header = this.set;
    setHeader = this.set;
    get(field) {
        return this.headers[field.toLowerCase()];
    }
    getHeader = this.get;
    removeHeader(field) {
        delete this.headers[field.toLowerCase()];
        return this;
    }
    append(field, value) {
        field = field.toLowerCase();
        const old = this.headers[field];
        if(old) {
            const newVal = [];
            if(Array.isArray(old)) {
                newVal.push(...old);
            } else if(old) {
                newVal.push(old);
            }
            if(Array.isArray(value)) {
                newVal.push(...value);
            } else {
                newVal.push(value);
            }
            this.headers[field] = newVal;
        } else {
            this.headers[field] = value;
        }
        return this;
    }
    render(view, options, callback) {
        if(typeof options === 'function') {
            callback = options;
            options = {};
        }
        if(!options) {
            options = {};
        } else {
            options = Object.assign({}, options);
        }
        options._locals = this.locals;
        const done = callback || ((err, str) => {
            if(err) return this.req.next(err);
            this.send(str);
        });

        this.app.render(view, options, done);
    }
    cookie(name, value, options) {
        const opt = {...(options ?? {})}; // create a new ref because we change original object (https://github.com/dimdenGD/ultimate-express/issues/68)
        let val = typeof value === 'object' ? "j:"+JSON.stringify(value) : String(value);
        if(opt.maxAge != null) {
            const maxAge = opt.maxAge - 0;
            if(!isNaN(maxAge)) {
                opt.expires = new Date(Date.now() + maxAge);
                opt.maxAge = Math.floor(maxAge / 1000);
            }
        }
        if(opt.signed) {
            val = 's:' + sign(val, this.req.secret);
        }

        if(opt.path == null) {
            opt.path = '/';
        }

        this.append('Set-Cookie', cookie.serialize(name, val, opt));
        return this;
    }
    clearCookie(name, options) {
        const opts = { path: '/', ...options, expires: new Date(1) };
        delete opts.maxAge;
        return this.cookie(name, '', opts);
    }
    attachment(filename) {
        this.headers['Content-Disposition'] = `attachment; filename="${filename}"`;
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
        if(!this.headers['content-type']) {
            this.headers['content-type'] = 'application/json; charset=utf-8';
        }
        const escape = this.app.get('json escape');
        const replacer = this.app.get('json replacer');
        const spaces = this.app.get('json spaces');
        this.send(stringify(body, replacer, spaces, escape));
    }
    jsonp(object) {
        let callback = this.req.query[this.app.get('jsonp callback name')];
        let body = stringify(object, this.app.get('json replacer'), this.app.get('json spaces'), this.app.get('json escape'));

        if(!this.headers['content-type']) {
            this.headers['content-type'] = 'application/javascript; charset=utf-8';
            this.headers['X-Content-Type-Options'] = 'nosniff';
        }

        if(Array.isArray(callback)) {
            callback = callback[0];
        }

        if(typeof callback === 'string' && callback.length !== 0) {
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
        this.headers['link'] = Object.entries(links).map(([rel, url]) => `<${url}>; rel="${rel}"`).join(', ');
        return this;
    }
    location(path) {
        if(path === 'back') {
            path = this.req.get('Referrer');
            if(!path) path = this.req.get('Referer');
            if(!path) path = '/';
        }
        return this.headers['location'] = encodeUrl(path);
    }
    redirect(status, url) {
        if(typeof status !== 'number' && !url) {
            url = status;
            status = 302;
        }
        this.location(url);
        this.status(status);
        this.headers['content-type'] = 'text/plain; charset=utf-8';
        return this.send(`${statuses.message[status] ?? status}. Redirecting to ${url}`);
    }

    type(type) {
        let ct = type.indexOf('/') === -1
            ? (mime.contentType(type) || 'application/octet-stream')
            : type;

        return this.set('content-type', ct);
    }
    contentType = this.type;

    vary(field) {
        vary(this, field);
        return this;
    }

    get connection() {
        return this.socket;
    }

    get writableFinished() {
        return this.finished;
    }
}

function pipeStreamOverResponse(res, readStream, totalSize, callback) {
    readStream.on('data', (chunk) => {
        if(res.finished) {
            return readStream.destroy();
        }
        res._res.cork(() => {
            if(!res.headersSent) {
                res.writeHead(res.statusCode);
                res._res.writeStatus(res.statusCode.toString());
                res.writeHeaders(true);
            }
            const ab = chunk.buffer.slice(chunk.byteOffset, chunk.byteOffset + chunk.byteLength);
        
            const lastOffset = res._res.getWriteOffset();
            const [ok, done] = res._res.tryEnd(ab, totalSize);
      
            if (done) {
                readStream.destroy();
                res.finished = true;
                if(res.socketExists) res.socket.emit('close');
                if(callback) callback();
            } else if (!ok) {
                readStream.pause();
        
                res._res.ab = ab;
                res._res.abOffset = lastOffset;
        
                res._res.onWritable((offset) => {
                    if(res.finished) {
                        return true;
                    }
                    const [ok, done] = res._res.tryEnd(res._res.ab.slice(offset - res._res.abOffset), totalSize);
                    if (done) {
                        readStream.destroy();
                        res.finished = true;
                        if(res.socketExists) res.socket.emit('close');
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
        if(!res.finished) {
            res._res.close();
            res.finished = true;
            if(res.socketExists) res.socket.emit('error', e);
        }
    });
}
