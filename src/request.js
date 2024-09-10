export default class Request {
    #req;
    constructor(req, app) {
        this.#req = req;
        this.app = app;
        this.path = req.getUrl();
        this.method = req.getMethod().toUpperCase();
        this.params = {};
        this._gotParams = [];
    }
}