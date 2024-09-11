import { patternToRegex } from "./utils.js";

export default class Request {
    #req;
    constructor(req, app) {
        this.#req = req;
        this.app = app;
        this.path = req.getUrl();
        if(this.path.endsWith('/') && this.path !== '/') {
            this.path = this.path.slice(0, -1);
        }
        this.method = req.getMethod().toUpperCase();
        this.params = {};
        this._gotParams = [];
        this._stack = [];
    }
    get baseUrl() {
        let match = this.path.match(patternToRegex(this._stack.join(""), true));
        return match ? match[0] : '';
    }
}