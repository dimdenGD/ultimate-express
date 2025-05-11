// must support res.writeHead()

const express = require("express");
const { fetchTest } = require("../../utils");

const app = express();

app.get('/test-1', (req, res) => {
    res.writeHead(201).end('test-1');
});

app.get('/test-2', (req, res) => {
    res.writeHead(202, {
        'x-test': '2'
    }).end('test-2');
});

app.get('/test-3', (req, res) => {
    res.writeHead(203, 'test-3', {
        'x-test': '3'
    }).end('test-3');
});


app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const response = await Promise.all([
        fetchTest('http://localhost:13333/test-1'), 
        fetchTest('http://localhost:13333/test-2'), 
        fetchTest('http://localhost:13333/test-3')
    ])

    for (const res of response) {
        console.log({
            status: res.status,
            header: res.headers.get('x-test'),
            statusText: res.statusText,
            body: await res.text()
        });
    }

    process.exit(0)
});
