const { patternToRegex, deprecated } = require("./utils.js");
const accepts = require("accepts");
const typeis = require("type-is");
const parseRange = require("range-parser");
const proxyaddr = require("proxy-addr");
const fresh = require("fresh");
const { Readable } = require("stream");

const discardedDuplicates = [
    "age", "authorization", "content-length", "content-type", "etag", "expires",
    "from", "host", "if-modified-since", "if-unmodified-since", "last-modified",
    "location", "max-forwards", "proxy-authorization", "referer", "retry-after",
    "server", "user-agent"
];

module.exports = class Request extends Readable {
    #cachedQuery = null;
    #cachedHeaders = null;
    #cachedDistinctHeaders = null;
    #rawHeadersEntries = [];
    constructor(req, res, app) {
        super();
        this._res = res;
        this._req = req;
        this.readable = true;
        this._req.forEach((key, value) => {
            this.#rawHeadersEntries.push([key, value]);
        });
        this.app = app;
        this.urlQuery = req.getQuery() ?? '';
        if(this.urlQuery) {
            this.urlQuery = '?' + this.urlQuery;
        }
        this.originalUrl = req.getUrl() + this.urlQuery;
        this.url = this.originalUrl;
        const iq = this.url.indexOf('?');
        this.path = iq !== -1 ? this.url.substring(0, iq) : this.url;
        this.endsWithSlash = this.path[this.path.length - 1] === '/';
        this._opPath = this.path;
        if(this.endsWithSlash && this.path !== '/' && !this.app.get('strict routing')) {
            this._opPath = this._opPath.slice(0, -1);
        }
        this.method = req.getMethod().toUpperCase();
        this.params = {};

        this._gotParams = new Set();
        this._stack = [];
        this._paramStack = [];
        this.bufferedData = Buffer.allocUnsafe(0);
        this.receivedData = false;

        const additionalMethods = this.app.get('body methods');
        // skip reading body for non-POST requests
        // this makes it +10k req/sec faster
        if(
            this.method === 'POST' ||
            this.method === 'PUT' ||
            this.method === 'PATCH' || 
            (additionalMethods && additionalMethods.includes(this.method))
        ) {
            this._res.onData((ab, isLast) => {
                // make stream actually readable
                this.receivedData = true;
                // instead of pushing data immediately, buffer it
                // because writable streams cant handle the amount of data uWS gives (usually 512kb+)
                const chunk = Buffer.from(ab);
                this.bufferedData = Buffer.concat([this.bufferedData, chunk]);
                if(isLast) {
                    // once its done start pushing data
                    this._read();
                }
            });
        } else {
            this.receivedData = true;
        }
    }

    async _read() {
        if(!this.receivedData) {
            return;
        }
        if(this.bufferedData.length > 0) {
            // push 64kb chunks
            const chunk = this.bufferedData.subarray(0, 1024 * 64);
            this.bufferedData = this.bufferedData.subarray(1024 * 64);
            this.push(chunk);
        } else {
            this.push(null);
        }
    }

    get baseUrl() {
        let match = this.path.match(patternToRegex(this._stack.join(""), true));
        return match ? match[0] : '';
    }

    get #host() {
        const trust = this.app.get('trust proxy fn');
        if(!trust) {
            return this.get('host');
        }
        let val = this.headers['x-forwarded-host'];
        if (!val || !trust(this.connection.remoteAddress, 0)) {
            val = this.headers['host'];
        } else if (val.indexOf(',') !== -1) {
            // Note: X-Forwarded-Host is normally only ever a
            //       single value, but this is to be safe.
            val = val.substring(0, val.indexOf(',')).trimRight()
        }
        
        return val ? val.split(':')[0] : undefined;
    }

    get host() {
        deprecated('req.host', 'req.hostname');
        return this.hostname;
    }

    get hostname() {
        const host = this.#host;
        if(!host) return this.headers['host'].split(':')[0];
        const offset = host[0] === '[' ? host.indexOf(']') + 1 : 0;
        const index = host.indexOf(':', offset);
        return index !== -1 ? host.slice(0, index) : host;
    }

    get httpVersion() {
        return '1.1';
    }

    get httpVersionMajor() {
        return 1;
    }

    get httpVersionMinor() {
        return 1;
    }

    get ip() {
        const trust = this.app.get('trust proxy fn');
        if(!trust) {
            return Buffer.from(this._res.getRemoteAddressAsText()).toString();
        }
        return proxyaddr(this, trust);
    }

    get ips() {
        const trust = this.app.get('trust proxy fn');
        if(!trust) {
            return [];
        }
        const addrs = proxyaddr.all(this, trust);
        addrs.reverse().pop();
        return addrs;
    }

    get protocol() {
        const proto = this.app.ssl ? 'https' : 'http';
        const trust = this.app.get('trust proxy fn');
        if(!trust) {
            return proto;
        }
        if(!trust(this.connection.remoteAddress, 0)) {
            return proto;
        }
        const header = this.headers['x-forwarded-proto'] || proto;
        const index = header.indexOf(',');

        return index !== -1 ? header.slice(0, index).trim() : header.trim();
    }

    get query() {
        if(this.#cachedQuery) {
            return this.#cachedQuery;
        }
        const qp = this.app.get('query parser fn');
        if(qp) {
            this.#cachedQuery = qp(this.urlQuery.slice(1));
        } else {
            this.#cachedQuery = {};
        }
        return this.#cachedQuery;
    }

    get secure() {
        return this.protocol === 'https';
    }

    get subdomains() {
        let host = this.hostname;
        let subdomains = host.split('.');
        const so = this.app.get('subdomain offset');
        if(so === 0) {
            return subdomains.reverse();
        }
        return subdomains.slice(0, -so).reverse();
    }

    get xhr() {
        return this.headers['x-requested-with'] === 'XMLHttpRequest';
    }

    get connection() {
        return {
            remoteAddress: Buffer.from(this.res._res.getRemoteAddressAsText()).toString(),
            localPort: this.app.port,
            remotePort: this.app.port,
            encrypted: this.app.ssl,
        };
    }

    get fresh() {
        if(this.method !== 'HEAD' && this.method !== 'GET') {
            return false;
        }
        if((this.res.statusCode >= 200 && this.res.statusCode < 300) || this.res.statusCode === 304) {
            return fresh(this.headers, {
                'etag': this.res.headers['etag'],
                'last-modified': this.res.headers['last-modified'],
            });
        }
        return false;
    }

    get stale() {
        return !this.fresh;
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
        deprecated('req.param(name)', 'req.params, req.body, or req.query');
        if(this.params[name]) {
            return this.params[name];
        }
        if(this.body && this.body[name]) {
            return this.body[name];
        }
        return this.query[name] ?? defaultValue;
    }

    range(size, options) {
        const range = this.headers['range'];
        if(!range) return;
        return parseRange(size, range, options);
    }

    get headers() {
        // https://nodejs.org/api/http.html#messageheaders
        if(this.#cachedHeaders) {
            return this.#cachedHeaders;
        }
        let headers = {};
        this.#rawHeadersEntries.forEach((val) => {
            const key = val[0].toLowerCase();
            const value = val[1];
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
        this.#rawHeadersEntries.forEach((val) => {
            if(!headers[val[0]]) {
                headers[val[0]] = [];
            }
            headers[val[0]].push(val[1]);
        });
        this.#cachedDistinctHeaders = headers;
        return headers;
    }

    get rawHeaders() {
        const res = [];
        this.#rawHeadersEntries.forEach((val) => {
            res.push(val[0], val[1]);
        });
        return res;
    }
}