import { patternToRegex } from "./utils.js";

const discardedDuplicates = [
    "age", "authorization", "content-length", "content-type", "etag", "expires",
    "from", "host", "if-modified-since", "if-unmodified-since", "last-modified",
    "location", "max-forwards", "proxy-authorization", "referer", "retry-after",
    "server", "user-agent"
];

class IncomingMessage {
    #req;
    #res;
    #app;
    #cachedHeaders = null;
    #cachedDistinctHeaders = null;
    constructor(req, res, app) {
        this.#req = req;
        this.#res = res;
        this.#app = app;
    }

    get headers() {
        // https://nodejs.org/api/http.html#messageheaders
        if(this.#cachedHeaders) {
            return this.#cachedHeaders;
        }
        let headers = {};
        this.#req.forEach((key, value) => {
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
        this.#req.forEach((key, value) => {
            if(!headers[key]) {
                headers[key] = [];
            }
            headers[key].push(value);
        });
        this.#cachedDistinctHeaders = headers;
        return headers;
    }
}

export default class Request extends IncomingMessage {
    #req;
    constructor(req, res, app) {
        super(req, res, app);
        this.#req = req;
        this.res = res;
        this.app = app;
        this.path = req.getUrl();
        // remove trailing slash
        if(this.path.endsWith('/') && this.path !== '/') {
            this.path = this.path.slice(0, -1);
        }
        this.method = req.getMethod().toUpperCase();
        this.params = {};
        this._gotParams = new Set();
        this._stack = [];
        this._opPath = this.path;
    }
    get baseUrl() {
        let match = this.path.match(patternToRegex(this._stack.join(""), true));
        return match ? match[0] : '';
    }
}