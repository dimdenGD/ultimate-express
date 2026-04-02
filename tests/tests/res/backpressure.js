// must use node backpressure semantics for stream and one-shot responses

const assert = require("node:assert");
const Response = require("../../../src/response.js");

const HIGH_WATERMARK = 128 * 1024;

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

function runOneShotBackpressureTest() {
    const calls = [];
    let writableHandler;
    let tryEndCalls = 0;

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
        end(data) {
            calls.push(['end', data ? Buffer.from(data).byteLength : 0]);
            return this;
        },
        endWithoutBody(length) {
            calls.push(['endWithoutBody', length]);
            return this;
        },
        close() {
            calls.push(['close']);
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
        tryEnd(chunk, totalSize) {
            tryEndCalls++;
            calls.push(['tryEnd', Buffer.from(chunk).byteLength, totalSize]);
            return tryEndCalls === 1 ? [false, false] : [true, true];
        }
    };

    const res = new Response(rawRes, req, app);
    req.res = res;
    res.req = req;

    const payload = Buffer.alloc(256 * 1024);
    res.set('Content-Length', String(payload.length));
    res.end(payload);

    setTimeout(() => {
        assert.strictEqual(typeof writableHandler, 'function');
        assert.deepStrictEqual(
            calls.filter(([type]) => type === 'tryEnd' || type === 'onWritable'),
            [
                ['tryEnd', payload.length, payload.length],
                ['onWritable']
            ]
        );

        writableHandler(0);

        setTimeout(() => {
            assert.deepStrictEqual(
                calls.filter(([type]) => type === 'tryEnd'),
                [
                    ['tryEnd', payload.length, payload.length],
                    ['tryEnd', payload.length, payload.length]
                ]
            );
            console.log('one-shot backpressure ok');
            process.exit(0);
        }, 0);
    }, 10);
}

function runStreamBackpressureTest() {
    const calls = [];
    const events = [];
    let writableHandler;
    let writeCount = 0;

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
                runOneShotBackpressureTest();
            }, 0);
        }, 0);
    }, 10);
}

runStreamBackpressureTest();
