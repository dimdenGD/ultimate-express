// must support "trust proxy" hosts

import express from "express";

const app = express();
const app2 = express();
const app3 = express();
const app4 = express();
app.set('trust proxy', true);
app2.set('trust proxy', false);
app3.set('trust proxy', 'loopback');
app4.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal']);

app.get('/abc', (req, res) => {
    res.send(req.hostname);
});
app2.get('/abc', (req, res) => {
    res.send(req.hostname);
});
app3.get('/abc', (req, res) => {
    res.send(req.hostname);
});
app4.get('/abc', (req, res) => {
    res.send(req.hostname);
});

app.listen(13333, async () => {
    app2.listen(13334, async () => {
        app3.listen(13335, async () => {
            app4.listen(13336, async () => {
                let outputs = await Promise.all([
                    fetch('http://localhost:13333/abc', { headers: { 'X-Forwarded-Host': '127.0.0.1' } }).then(res => res.text()),
                    fetch('http://localhost:13334/abc', { headers: { 'X-Forwarded-Host': '127.0.0.1' } }).then(res => res.text()),
                    fetch('http://localhost:13335/abc', { headers: { 'X-Forwarded-Host': '127.0.0.1' } }).then(res => res.text()),
                    fetch('http://localhost:13336/abc', { headers: { 'X-Forwarded-Host': '127.0.0.1' } }).then(res => res.text()),
                    fetch('http://localhost:13333/abc', { headers: { 'X-Forwarded-Host': '192.168.1.1' } }).then(res => res.text()),
                    fetch('http://localhost:13334/abc', { headers: { 'X-Forwarded-Host': '192.168.1.1' } }).then(res => res.text()),
                    fetch('http://localhost:13335/abc', { headers: { 'X-Forwarded-Host': '192.168.1.1' } }).then(res => res.text()),
                    fetch('http://localhost:13336/abc', { headers: { 'X-Forwarded-Host': '192.168.1.1' } }).then(res => res.text()),
                    fetch('http://localhost:13333/abc', { headers: { 'X-Forwarded-Host': '10.0.0.1' } }).then(res => res.text()),
                    fetch('http://localhost:13334/abc', { headers: { 'X-Forwarded-Host': '10.0.0.1' } }).then(res => res.text()),
                    fetch('http://localhost:13335/abc', { headers: { 'X-Forwarded-Host': '10.0.0.1' } }).then(res => res.text()),
                    fetch('http://localhost:13336/abc', { headers: { 'X-Forwarded-Host': '10.0.0.1' } }).then(res => res.text()),
                    fetch('http://localhost:13333/abc', { headers: { 'X-Forwarded-Host': '172.16.0.1' } }).then(res => res.text()),
                    fetch('http://localhost:13334/abc', { headers: { 'X-Forwarded-Host': '172.16.0.1' } }).then(res => res.text()),
                    fetch('http://localhost:13335/abc', { headers: { 'X-Forwarded-Host': '172.16.0.1' } }).then(res => res.text()),
                    fetch('http://localhost:13336/abc', { headers: { 'X-Forwarded-Host': '172.16.0.1' } }).then(res => res.text()),
                    fetch('http://localhost:13333/abc').then(res => res.text()),
                    fetch('http://localhost:13334/abc').then(res => res.text()),
                    fetch('http://localhost:13335/abc').then(res => res.text()),
                    fetch('http://localhost:13336/abc').then(res => res.text()),
                ]);
                console.log(outputs.join(' ').replaceAll('0000:0000:0000:0000:0000:0000:0000:000', "::"));
                process.exit(0);
            });
        });
    });
});