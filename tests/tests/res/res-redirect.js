// must support res.redirect()

const express = require("express");
const { fetchTest } = require("../../utils");

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

    const response = await fetchTest('http://localhost:13333/test', { redirect: 'manual' });
    console.log(response.status, response.headers.get('Location'), response.headers.get('Vary'), await response.text());

    const response2 = await fetchTest('http://localhost:13333/test2', { redirect: 'manual' });
    console.log(response2.status, response2.headers.get('Location'), response.headers.get('Vary'));

    const response3 = await fetchTest('http://localhost:13333/test3', { redirect: 'manual' });
    console.log(response3.status, response3.headers.get('Location'), response.headers.get('Vary'));

    const response4 = await fetchTest('http://localhost:13333/test4', { redirect: 'manual' });
    console.log(response4.status, response4.headers.get('Location'), response.headers.get('Vary'));

    const response5 = await fetchTest('http://localhost:13333/test5', { redirect: 'manual' });
    console.log(response5.status, response5.headers.get('Location'), response.headers.get('Vary'));

    const response6 = await fetchTest('http://localhost:13333/test6', { redirect: 'manual' });
    console.log(response6.status, response6.headers.get('Location'), response.headers.get('Vary'));

    process.exit(0);
});