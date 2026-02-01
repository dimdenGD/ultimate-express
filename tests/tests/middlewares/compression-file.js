// must support compression middleware with files

const express = require("express");
const compression = require("compression");

const app = express();

app.use(compression({
    threshold: 1,
}));

app.use(express.static('tests/parts'));

app.get('/test', (req, res) => {
    res.sendFile('tests/parts/large-file.json', { root: "." });
});

app.get('/abc', (req, res) => {
    res.send('Hello World');
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const [response1, response2, response3, response4] = await Promise.all([
        // sent with pipe
        fetch('http://localhost:13333/large-file.json', {
            method: 'GET',
            headers: {
                'Accept-Encoding': 'gzip',
            },
            keepalive: true,
        }),
        // sent with pipe
        fetch('http://localhost:13333/medium-file.json', {
            method: 'GET',
            headers: {
                'Accept-Encoding': 'gzip',
            },
            keepalive: true,
        }),
        // sent with worker
        fetch('http://localhost:13333/small-file.json', {
            method: 'GET',
            headers: {
                'Accept-Encoding': 'gzip',
            },
            keepalive: true,
        }),
        // sent with res.sendFile
        fetch('http://localhost:13333/test', {
            method: 'GET',
            headers: {
                'Accept-Encoding': 'gzip',
            },
            keepalive: true,
        }),
    ]);

    const [data1, data2, data3, data4] = await Promise.all([
        response1.text(),
        response2.text(),
        response3.text(),
        response4.text(),
    ]);

    console.log(response1.headers.get('content-encoding'), response1.headers.get('content-encoding') === 'gzip');
    console.log(response1.headers.get('transfer-encoding'));
    console.log(response1.headers.get('Etag'));
    console.log(response1.headers.get('content-type').toLowerCase());
    console.log(data1);

    console.log(response2.headers.get('content-encoding'), response2.headers.get('content-encoding') === 'gzip');
    console.log(response2.headers.get('transfer-encoding'));
    console.log(response2.headers.get('Etag'));
    console.log(response2.headers.get('content-type').toLowerCase());
    console.log(data2);

    console.log(response3.headers.get('content-encoding'), response3.headers.get('content-encoding') === 'gzip');
    console.log(response3.headers.get('transfer-encoding'));
    console.log(response3.headers.get('Etag'));
    console.log(response3.headers.get('content-type').toLowerCase());
    console.log(data3);

    console.log(response4.headers.get('content-encoding'), response4.headers.get('content-encoding') === 'gzip');
    console.log(response4.headers.get('transfer-encoding'));
    console.log(response4.headers.get('Etag'));
    console.log(response4.headers.get('content-type').toLowerCase());
    console.log(data4);

    process.exit(0);

});