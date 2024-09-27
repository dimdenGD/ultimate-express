const fs = require("fs");
const { parentPort } = require("worker_threads");
const etag = require('etag');

parentPort.on('message', (message) => {
    if(message.type === 'readFile') {
        try {
            const data = fs.readFileSync(message.path);
            const ab = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
            parentPort.postMessage({ key: message.key, data: ab }, [ab]);
        } catch(err) {
            parentPort.postMessage({ key: message.key, err: String(err) });
        }
    } else if(message.type === 'generateETag') {
        const isAb = typeof message.body !== 'string';
        let data = isAb ? Buffer.from(message.body) : message.body;
        const e = etag(data, message.options);
        const transferable = isAb ? [message.body] : [];

        parentPort.postMessage({ key: message.key, data: [e, message.body] }, transferable);
    }
});
