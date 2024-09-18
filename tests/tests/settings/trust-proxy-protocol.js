// must support "trust proxy" protocol

const express = require("express");

const app = express();
const app2 = express();
const app3 = express();
const app4 = express();
app.set('trust proxy', true);
app2.set('trust proxy', false);
app3.set('trust proxy', 'loopback');
app4.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal']);

app.get('/abc', (req, res) => {
    res.send(req.protocol);
});
app2.get('/abc', (req, res) => {
    res.send(req.protocol);
});
app3.get('/abc', (req, res) => {
    res.send(req.protocol);
});
app4.get('/abc', (req, res) => {
    res.send(req.protocol);
});

app.listen(13333, async () => {
    app2.listen(13334, async () => {
        app3.listen(13335, async () => {
            app4.listen(13336, async () => {
                let outputs = await Promise.all([
                    fetch('http://localhost:13333/abc', { headers: { 'X-Forwarded-Proto': 'https' } }).then(res => res.text()),
                    fetch('http://localhost:13334/abc', { headers: { 'X-Forwarded-Proto': 'https' } }).then(res => res.text()),
                    fetch('http://localhost:13335/abc', { headers: { 'X-Forwarded-Proto': 'https' } }).then(res => res.text()),
                    fetch('http://localhost:13336/abc', { headers: { 'X-Forwarded-Proto': 'https' } }).then(res => res.text()),
                    fetch('http://localhost:13333/abc', { headers: { 'X-Forwarded-Proto': 'http' } }).then(res => res.text()),
                    fetch('http://localhost:13334/abc', { headers: { 'X-Forwarded-Proto': 'http' } }).then(res => res.text()),
                    fetch('http://localhost:13335/abc', { headers: { 'X-Forwarded-Proto': 'http' } }).then(res => res.text()),
                    fetch('http://localhost:13336/abc', { headers: { 'X-Forwarded-Proto': 'http' } }).then(res => res.text()),
                ]);
                console.log(outputs.join(' '));
                process.exit(0);
            });
        });
    });
});