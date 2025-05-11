// must support body reading with different limits

const express = require("express");
const { fetchTest } = require("../../utils");

const app = express();

app.use(express.json({ limit: '100kb' }));
app.use(express.raw({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb' }));

app.post('/abc',  (req, res) => {
    res.send(req.body);
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const ab = new ArrayBuffer(1024 * 1024 * 10);
    const u8 = new Uint8Array(ab);

    for(let i = 0; i < u8.length; i++) {
        u8[i] = i % 256;
    }

    const response = await fetchTest('http://localhost:13333/abc', {
        method: 'POST',
        body: ab,
        headers: {
            'Content-Type': 'application/octet-stream'
        }
    });

    const text = await response.arrayBuffer();
    console.log(response.headers.get('content-type'));
    console.log(text);

    process.exit(0);

});