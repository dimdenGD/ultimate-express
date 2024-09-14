import { patternToRegex } from "./utils.js";
import qs from 'qs';
import accepts from 'accepts';
import typeis from 'type-is';
import parseRange from 'range-parser';

const discardedDuplicates = [
    "age", "authorization", "content-length", "content-type", "etag", "expires",
    "from", "host", "if-modified-since", "if-unmodified-since", "last-modified",
    "location", "max-forwards", "proxy-authorization", "referer", "retry-after",
    "server", "user-agent"
];

class IncomingMessage {
    #cachedHeaders = null;
    #cachedDistinctHeaders = null;
    #rawHeadersEntries = [];
    constructor(req) {
        this._req = req;
        this._req.forEach((key, value) => {
            this.#rawHeadersEntries.push([key, value]);
        });
    }

    get headers() {
        // https://nodejs.org/api/http.html#messageheaders
        if(this.#cachedHeaders) {
            return this.#cachedHeaders;
        }
        let headers = {};
        this.#rawHeadersEntries.forEach((key, value) => {
            if(headers[key]) {
                if(discardedDuplicates.includes(key)) {
                    return;
                }
                if(key === 'cookie') {
                    headers[key] += '; ' + value;
                } else if(key === 'set-cookie') {
                    headers[key].push(value);
                } else {
                    headers[key] += ', ' + value;
                }
                return;
            }
            if(key === 'set-cookie') {
                headers[key] = [value];
            } else {
                headers[key] = value;
            }
        });
        this.#cachedHeaders = headers;
        return headers;
    }

    get headersDistinct() {
        if(this.#cachedDistinctHeaders) {
            return this.#cachedDistinctHeaders;
        }
        let headers = {};
        this.#rawHeadersEntries.forEach((key, value) => {
            if(!headers[key]) {
                headers[key] = [];
            }
            headers[key].push(value);
        });
        this.#cachedDistinctHeaders = headers;
        return headers;
    }

    get rawHeaders() {
        const res = [];
        this.#rawHeadersEntries.forEach(([key, value]) => {
            res.push(key, value);
        });
        return res;
    }
}

export default class Request extends IncomingMessage {
    #cachedQuery = null;
    constructor(req, res, app) {
        super(req);
        this._req = req;
        this._res = res;
        this.app = app;
        this.urlQuery = req.getQuery() ?? '';
        if(this.urlQuery) {
            this.urlQuery = '?' + this.urlQuery;
        }
        this.originalUrl = req.getUrl() + this.urlQuery;
        this.url = this.originalUrl;
        this.path = this.url.split('?')[0];
        // remove trailing slash
        if(this.path.endsWith('/') && this.path !== '/') {
            this.path = this.path.slice(0, -1);
        }
        this._opPath = this.path;
        this.method = req.getMethod().toUpperCase();
        this.params = {};
        this._gotParams = new Set();
        this._stack = [];
    }
    get baseUrl() {
        let match = this.path.match(patternToRegex(this._stack.join(""), true));
        return match ? match[0] : '';
    }

    get hostname() {
        // TODO: support trust proxy
        return this._req.getHeader('host').split(':')[0];
    }

    get ip() {
        // TODO: support trust proxy
        let ip = Buffer.from(this._res.getRemoteAddressAsText()).toString();
        return ip;
    }

    get protocol() {
        // TODO: support trust proxy
        // TODO: implement ssl
        return this.app.ssl ? 'https' : 'http';
    }

    get query() {
        if(this.#cachedQuery) {
            return this.#cachedQuery;
        }
        // TODO: support "query parser" option
        this.#cachedQuery = qs.parse(this.urlQuery.slice(1));
        return this.#cachedQuery;
    }

    get secure() {
        return this.protocol === 'https';
    }

    get subdomains() {
        let host = this.hostname;
        let subdomains = host.split('.');
        // TODO: support "subdomain offset" option
        return subdomains.slice(0, -2).reverse();
    }

    get xhr() {
        return this._req.getHeader('x-requested-with') === 'XMLHttpRequest';
    }

    get connection() {
        return {
            remoteAddress: Buffer.from(this.res._res.getRemoteAddressAsText()).toString(),
            localPort: this.app.port,
            remotePort: this.app.port
        };
    }

    get(field) {
        field = field.toLowerCase();
        if(field === 'referrer' || field === 'referer') {
            const res = this.headers['referrer'];
            if(!res) {
                return this.headers['referer'];
            }
            return res;
        } 
        return this.headers[field];
    }

    accepts(...types) {
        const accept = accepts({ headers: this.headers });
        return accept.types(...types);
    }

    acceptsCharsets(...charsets) {
        const accept = accepts({ headers: this.headers });
        return accept.charsets(...charsets);
    }

    acceptsEncodings(...encodings) {
        const accept = accepts({ headers: this.headers });
        return accept.encodings(...encodings);
    }
    
    acceptsLanguages(...languages) {
        const accept = accepts({ headers: this.headers });
        return accept.languages(...languages);
    }

    is(type) {
        return typeis(this, type);
    }

    param(name, defaultValue) {
        if(this.params[name]) {
            return this.params[name];
        }
        if(this.body && this.body[name]) {
            return this.body[name];
        }
        return this.query[name] ?? defaultValue;
    }

    range(size, options) {
        const range = this._req.getHeader('range');
        if(!range) return;
        return parseRange(size, range, options);
    }
}