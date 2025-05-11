// must support req.fresh and req.stale

const express = require("express");
const { fetchTest } = require("../../utils");

const app = express();

app.get('/test', (req, res) => {
    res.once('finish', () => console.log('finish'));
    res.once('close', () => console.log('close'));
    res.set('ETag', '"123"');
    res.send([req.fresh, req.stale]);
});

const date = new Date();

app.get('/test2', (req, res) => {
    res.set('Etag', '"1234"');
    res.set('last-modified', date.toISOString());
    res.send([req.fresh, req.stale]);
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const responses = await Promise.all([
        fetchTest('http://localhost:13333/test', {
            headers: {
                'cache-control': 'max-age=604800',
            },
        }),
        fetchTest('http://localhost:13333/test', {
            headers: {
                'cache-control': 'max-age=604800',
                'if-none-match': '"123"',
            },
        }),
        fetchTest('http://localhost:13333/test', {
            headers: {
                'cache-control': 'max-age=604800',
                'if-none-match': '"1234"',
            },
        }),
        fetchTest('http://localhost:13333/test2', {
            headers: {
                'cache-control': 'max-age=604800',
            },
        }),
        fetchTest('http://localhost:13333/test2', {
            headers: {
                'cache-control': 'max-age=604800',
                'if-modified-since': new Date(date.getTime() - 1000).toISOString(),
            },
        }),
    ]);

    const texts = await Promise.all(responses.map(res => res.text()));

    console.log(texts, responses.map(res => res.status));

    process.exit(0);
});