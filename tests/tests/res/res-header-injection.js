// must reject CR/LF/NUL in header values and invalid header names

const express = require("express");

const app = express();

const payload = 'en\r\nX-Injected: pwned\r\n\r\n<script>alert(1)</script>';

app.get('/set', (req, res) => {
    res.set('Content-Language', payload);
    res.send('should not be sent');
});

app.get('/set-object', (req, res) => {
    res.set({ 'X-Test': payload });
    res.send('should not be sent');
});

app.get('/header', (req, res) => {
    res.header('X-Test', 'a\nX-Injected: pwned');
    res.send('should not be sent');
});

app.get('/set-header', (req, res) => {
    res.setHeader('X-Test', 'a\rX-Injected: pwned');
    res.send('should not be sent');
});

app.get('/set-header-array', (req, res) => {
    res.setHeader('X-Test', ['ok', payload]);
    res.send('should not be sent');
});

app.get('/nul', (req, res) => {
    res.set('X-Test', 'a\0b');
    res.send('should not be sent');
});

app.get('/append', (req, res) => {
    res.append('X-Test', payload);
    res.send('should not be sent');
});

app.get('/append-existing', (req, res) => {
    res.append('X-Test', 'ok');
    res.append('X-Test', payload);
    res.send('should not be sent');
});

app.get('/type', (req, res) => {
    res.type('text/html\r\nX-Injected: pwned');
    res.send('should not be sent');
});

app.get('/write-head', (req, res) => {
    res.writeHead(200, { 'X-Test': payload });
    res.end('should not be sent');
});

app.get('/write-head-message', (req, res) => {
    try {
        res.writeHead(200, 'OK\r\nX-Injected: pwned');
    } catch (err) {
        res.statusMessage = 'OK';
        res.send(err.code);
    }
});

app.get('/name', (req, res) => {
    res.set('X-Foo: bar\r\nX-Injected', 'pwned');
    res.send('should not be sent');
});

app.get('/name-space', (req, res) => {
    res.setHeader('X Test', 'ok');
    res.send('should not be sent');
});

app.get('/valid', (req, res) => {
    res.set('X-Test', 'ok\tvalue');
    res.append('X-Test-2', ['1', '2']);
    res.send('valid');
});

app.use((err, req, res, next) => {
    res.status(500).send(err.code);
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const paths = [
        '/set', '/set-object', '/header', '/set-header', '/set-header-array', '/nul',
        '/append', '/append-existing', '/type', '/write-head', '/write-head-message',
        '/name', '/name-space', '/valid'
    ];

    for (const path of paths) {
        const response = await fetch(`http://localhost:13333${path}`);
        console.log(path, response.status, response.headers.get('x-injected'), response.headers.get('x-test'), await response.text());
    }

    process.exit(0);
});
