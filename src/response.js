import cookie from 'cookie';

export default class Response {
    #res;
    constructor(res, app) {
        this.#res = res;
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
        if(this.#res.aborted) {
            return;
        }
        this.#res.cork(() => {
            this.#res.writeStatus(this.statusCode.toString());
            for(const [field, value] of Object.entries(this.headers)) {
                this.#res.writeHeader(field, value);
            }
            if(this.body !== undefined) {
                this.#res.write(this.body);
            }
            this.#res.end();
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
    getHeader(field) {
        return this.headers[field.toLowerCase()];
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
}