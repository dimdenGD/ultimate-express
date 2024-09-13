// must support req.range()

import express from "express";

const app = express();

app.get('/test', (req, res) => {
    console.log(req.range(10));
    console.log(req.range(1000));
    console.log(req.range(10000));
    console.log(req.range(100, {
        combine: true
    }));
    res.send('test');
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    await fetch('http://localhost:13333/test').then(res => res.text());
    await fetch('http://localhost:13333/test', {
        headers: {
            'Range': 'bytes=100-200'
        }
    }).then(res => res.text());
    await fetch('http://localhost:13333/test', {
        headers: {
            'Range': 'bytes=100-200, 300-400'
        }
    }).then(res => res.text());
    await fetch('http://localhost:13333/test', {
        headers: {
            'Range': 'bytes=100-200, 300-400, 500-600'
        }
    }).then(res => res.text());
    await fetch('http://localhost:13333/test', {
        headers: {
            'Range': 'bytes=100-200, 300-400, 500-600, 100-800'
        }
    }).then(res => res.text());
    await fetch('http://localhost:13333/test', {
        headers: {
            'Range': 'asdf'
        }
    }).then(res => res.text());

    process.exit(0);
});