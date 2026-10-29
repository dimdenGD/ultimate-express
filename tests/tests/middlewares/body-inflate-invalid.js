// must answer 400 for a body that fails to decompress and keep running
// SKIP_V4: express 4 does not support br

const express = require("express");

const app = express();

app.post('/abc', express.json(), (req, res) => {
    res.json({ ok: true });
});

app.post('/async', async (req, res, next) => {
    await new Promise(resolve => setTimeout(resolve, 10));
    next();
}, express.json(), (req, res) => {
    res.json({ ok: true });
});

app.get('/health', (req, res) => {
    res.send('up');
});

app.use((err, req, res, next) => {
    res.status(err.status || 500).json({ status: err.status, statusCode: err.statusCode, expose: err.expose });
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    for(const encoding of ['br', 'gzip', 'deflate']) {
        for(const path of ['abc', 'async']) {
            const response = await fetch(`http://localhost:13333/${path}`, {
                method: 'POST',
                body: Buffer.alloc(8, 0xff),
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Encoding': encoding
                }
            });
            console.log(encoding, path, response.status, await response.text());
        }
    }

    await new Promise(resolve => setTimeout(resolve, 50));
    const response = await fetch('http://localhost:13333/health');
    console.log(response.status, await response.text());

    process.exit(0);
});
