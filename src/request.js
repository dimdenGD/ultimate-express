export default class Request {
    #req;
    constructor(req) {
        this.#req = req;
        this.path = req.getUrl();
        this.method = req.getMethod().toUpperCase();
        this.params = {};
        this._gotParams = [];
    }
}