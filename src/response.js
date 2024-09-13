import cookie from 'cookie';
import mime from 'mime-types';
import vary from 'vary';
import { normalizeType, stringify } from './utils.js';

export default class Response {
    constructor(res, req, app) {
        this._res = res;
        this._req = req;
        this.app = app;
        this.headersSent = false;
        this.sent = false;
        this.statusCode = 200;
        this.headers = {
            'content-type': 'text/html',
            'keep-alive': 'timeout=10'
        };
        this.body = undefined;
    }
    status(code) {
        if(this.sent) {
            throw new Error('Can\'t set status: Response was already sent');
        }
        this.statusCode = code;
        return this;
    }
    end() {
        if(this.sent) {
            throw new Error('Can\'t end response: Response was already sent');
        }
        if(this._res.aborted) {
            return;
        }
        this._res.cork(() => {
            this._res.writeStatus(this.statusCode.toString());
            for(const [field, value] of Object.entries(this.headers)) {
                this._res.writeHeader(field, value);
            }
            if(this.body !== undefined) {
                this._res.write(this.body);
            }
            this._res.end();
            this.sent = true;
            this.headersSent = true;
        });
    }
    send(body) {
        if(this.sent) {
            throw new Error('Can\'t write body: Response was already sent');
        }
        this.body = body;
        this.end();
    }
    set(field, value) {
        if(this.sent) {
            throw new Error('Can\'t write headers: Response was already sent');
        }
        this.headers[field.toLowerCase()] = value;
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