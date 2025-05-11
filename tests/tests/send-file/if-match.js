// must support If-Match header

const express = require("express");
const { fetchTest } = require("../../utils");

const app = express();

app.get('/test', (req, res) => {
    res.sendFile('src/index.js', { root: '.' });
});

app.use((err, req, res, next) => {
    res.status(500).send(err.message);
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const response = await fetchTest('http://localhost:13333/test', {
        headers: {
            'If-Unmodified-Since': new Date(0).toUTCString()
        }
    });
    console.log(response.status, response.headers.get('ETag'));
    const response2 = await fetchTest('http://localhost:13333/test', {
        headers: {
            'If-Match': '"' + response.headers.get('ETag') + '"'
        }
    });
    console.log((await response2.text()).slice(0, 50), response2.status);

    const response3 = await fetchTest('http://localhost:13333/test', {
        headers: {
            'If-Match': '*'
        }
    });
    console.log((await response3.text()).slice(0, 50), response3.status);

    const response4 = await fetchTest('http://localhost:13333/test', {
        headers: {
            'If-Match': '"' + response.headers.get('ETag') + '", "' + response2.headers.get('ETag') + '",'
        }
    });
    console.log((await response4.text()).slice(0, 50), response4.status);
    process.exit(0);
});