// must support res.redirect()

const express = require("express");

const app = express();

app.get('/test', (req, res) => {
    res.redirect(301, 'http://example.com');
});

app.get('/test2', (req, res) => {
    res.redirect('http://example.com');
});

app.get('/test3', (req, res) => {
    res.redirect('/test');
});

app.get('/test4', (req, res) => {
    res.redirect('..');
});

app.get('/test5', (req, res) => {
    res.redirect(304, 'back');
});

app.get('/test6', (req, res) => {
    res.redirect(304, 'https://example.com/?test=%20 test %3F');
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const responses = [
        await fetch('http://localhost:13333/test', { redirect: 'manual' }),
        await fetch('http://localhost:13333/test2', { redirect: 'manual' }),
        await fetch('http://localhost:13333/test3', { redirect: 'manual' }),
        await fetch('http://localhost:13333/test4', { redirect: 'manual' }),
        await fetch('http://localhost:13333/test5', { redirect: 'manual' }),
        await fetch('http://localhost:13333/test6', { redirect: 'manual' }),
        await fetch('http://localhost:13333/test', { redirect: 'manual', headers: { 'accept': 'text/html' } }),
        await fetch('http://localhost:13333/test2', { redirect: 'manual', headers: { 'accept': 'text/html' } }),
        await fetch('http://localhost:13333/test3', { redirect: 'manual', headers: { 'accept': 'text/html' } }),
        await fetch('http://localhost:13333/test4', { redirect: 'manual', headers: { 'accept': 'text/html' } }),
        await fetch('http://localhost:13333/test5', { redirect: 'manual', headers: { 'accept': 'text/html' } }),
        await fetch('http://localhost:13333/test6', { redirect: 'manual', headers: { 'accept': 'text/html' } }),
        await fetch('http://localhost:13333/test', { redirect: 'manual', headers: { 'accept': 'text/plain' } }),
        await fetch('http://localhost:13333/test2', { redirect: 'manual', headers: { 'accept': 'text/plain' } }),
        await fetch('http://localhost:13333/test3', { redirect: 'manual', headers: { 'accept': 'text/plain' } }),
        await fetch('http://localhost:13333/test4', { redirect: 'manual', headers: { 'accept': 'text/plain' } }),
        await fetch('http://localhost:13333/test5', { redirect: 'manual', headers: { 'accept': 'text/plain' } }),
        await fetch('http://localhost:13333/test6', { redirect: 'manual', headers: { 'accept': 'text/plain' } }),
    ]

    for(const response of responses) {
        console.log(response.status, response.headers.get('Location'), response.headers.get('Vary'), await response.text());
    }

    process.exit(0);
});