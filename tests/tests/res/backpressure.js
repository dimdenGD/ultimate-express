// must use node drain, finish and close semantics under backpressure

const assert = require("node:assert");
const Response = require("../../../src/response.js");

const HIGH_WATERMARK = 128 * 1024;
const calls = [];
const events = [];
let writableHandler;
let writeCount = 0;

const app = {
    get(key) {
        if(key === 'x-powered-by') {
            return false;
        }
        if(key === 'etag fn') {
            return undefined;
        }
        return undefined;
    }
};

const req = {
    method: 'GET',
    fresh: false,
    noEtag: true
};

const rawRes = {
    cork(fn) {
        fn();
        return this;
    },
    writeStatus(status) {
        calls.push(['status', status]);
        return this;
    },
    writeHeader(name, value) {
        calls.push(['header', name, value]);
        return this;
    },
    write(chunk) {
        writeCount++;
        calls.push(['write', Buffer.from(chunk).byteLength]);
        return writeCount !== 1;
    },
    end(data) {
        calls.push(['end', data ? Buffer.from(data).byteLength : 0]);
        return this;
    },
    endWithoutBody(length) {
        calls.push(['endWithoutBody', String(length)]);
        return this;
    },
    close() {
        calls.push(['closeRaw']);
        return this;
    },
    getWriteOffset() {
        return 0;
    },
    onWritable(handler) {
        writableHandler = handler;
        calls.push(['onWritable']);
        return this;
    },
    tryEnd() {
        throw new Error('tryEnd should not be called');
    }
};

const res = new Response(rawRes, req, app);
req.res = res;
res.req = req;
res.socket;

res.on('drain', () => events.push('drain'));
res.on('finish', () => {
    assert.strictEqual(res.socket, null);
    events.push('finish');
});
res.on('close', () => events.push('close'));

const writeReturn = res.write(Buffer.alloc(HIGH_WATERMARK));
assert.strictEqual(writeReturn, false);

setTimeout(() => {
    assert.strictEqual(typeof writableHandler, 'function');
    assert.deepStrictEqual(events, []);

    writableHandler(0);

    setTimeout(() => {
        assert.deepStrictEqual(events, ['drain']);

        res.end('world', () => {
            events.push('endcb');
        });

        setTimeout(() => {
            assert.deepStrictEqual(
                calls.filter(([type]) => type === 'write' || type === 'end'),
                [
                    ['write', HIGH_WATERMARK],
                    ['write', 5],
                    ['end', 0]
                ]
            );
            assert.deepStrictEqual(events, ['drain', 'finish', 'endcb', 'close']);
            console.log('stream semantics ok');
            process.exit(0);
        }, 0);
    }, 0);
}, 10);
