const reusify = require('reusify')

class Holder {

    constructor() {
        this.next = null;
        this.response = null;
        this.request = null;
    }

    setState(that, res, req, holder){

        this.request = new that._request(req, res, that);
        this.response = new that._response(res, this.request, that);
        this.request.res = res;
        this.response.req = req;

        let isDone = false;
        const done = () => {
            if (isDone) return;
            isDone = true;

            // reset state
            this.response = null;
            this.request = null;

            pool.release(holder);
        };

        res.onAborted(() => {
            const err = new Error('Connection closed');
            err.code = 'ECONNRESET';
            response.aborted = true;
            response.finished = true;
            response.socket.emit('error', err);
            done();
        });

        this.response.socket.on('close', done)
    }
}

const pool = reusify(Holder)

module.exports = (that, res, req) => {
    const holder = pool.get();
    holder.setState(that, res, req, holder);
    return holder;
};