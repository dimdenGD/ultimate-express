// must end a streamed response when end() is called while the last chunk is waiting on backpressure

const express = require("express");

const app = express();

app.get('/test', (req, res) => {
    const uws = res._res;
    if(uws) {
        // ultimate-express only: make uWS report backpressure on the last chunk, then become writable again,
        // while Node's own buffer stays far below its high-water mark (so write() returns true and 'drain' is never emitted)
        const write = uws.write.bind(uws);
        const onWritable = uws.onWritable.bind(uws);
        let blocked = false;
        uws.write = chunk => {
            const ok = write(chunk);
            if(chunk.byteLength === 3) {
                blocked = true;
                return false;
            }
            return ok;
        };
        uws.onWritable = handler => {
            if(!blocked) return onWritable(handler);
            setTimeout(() => uws.cork(() => handler(uws.getWriteOffset())), 50);
        };
    }
    res.write('first chunk ', () => {
        res.write('end', () => {});
        res.end();
    });
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const response = await Promise.race([
        fetch('http://localhost:13333/test').then(response => response.text()),
        new Promise(resolve => setTimeout(() => resolve('response never ended'), 3000)),
    ]);
    console.log(response);
    process.exit(0);
});
