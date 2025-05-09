// must support Range header

const express = require("express");
const path = require("path");

const app = express();

// app.use(require("../../middleware"));

app.get('/test', (req, res) => {
    res.sendFile('src/index.js', { root: '.' });
});

app.use((err, req, res, next) => {
    res.status(500).send(err.message);
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const response = await fetch('http://localhost:13333/test', {
        headers: {
            Range: 'bytes=0-10'
        }
    });
    console.log(await response.text(), response.headers.get('Content-Range'), response.headers.get('Content-Length'), response.status);
    const response2 = await fetch('http://localhost:13333/test', {
        headers: {
            Range: 'bytes=11-20'
        }
    });
    console.log(await response2.text(), response2.headers.get('Content-Range'), response2.headers.get('Content-Length'), response2.status);
    const response3 = await fetch('http://localhost:13333/test', {
        headers: {
            Range: 'bytes=0-10, 21-30'
        }
    });
    console.log((await response3.text()).slice(0, 10), response3.headers.get('Content-Range'), response3.headers.get('Content-Length'), response3.status);
    const response4 = await fetch('http://localhost:13333/test', {
        headers: {
            Range: 'bytes=500-10000'
        }
    });
    console.log((await response4.text()).slice(0, 10), response4.headers.get('Content-Range'), response4.headers.get('Content-Length'), response4.status);
    const response5 = await fetch('http://localhost:13333/test', {
        headers: {
            Range: 'bytes=-10'
        }
    });
    console.log((await response5.text()).slice(0, 10), response5.headers.get('Content-Range'), response5.headers.get('Content-Length'), response5.status);

    const response6 = await fetch('http://localhost:13333/test', {
        headers: {
            Range: 'bytes=99999999999999999999999999-999999999999999999999999999999'
        }
    });
    console.log((await response6.text()).slice(0, 10), response6.headers.get('Content-Range'), response6.headers.get('Content-Length'), response6.status);
    process.exit(0);
});