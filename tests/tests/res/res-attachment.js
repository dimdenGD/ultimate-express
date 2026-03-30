// must support res.attachment()

const express = require("express");

const app = express();

app.get('/test', (req, res) => {
    res.attachment('test.png');
    res.send('test');
});

app.get('/test2', (req, res) => {
    res.attachment('tes\nt.png');
    res.send('test');
});

app.get('/test3', (req, res) => {
    res.attachment('test"t.png');
    res.send('test');
});

app.get('/test4', (req, res) => {
    res.attachment();
    res.send('test');
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const response = await fetch('http://localhost:13333/test');
    console.log(response.headers.get('Content-Disposition'));
    console.log(response.headers.get('Content-Type'));

    const response2 = await fetch('http://localhost:13333/test2');
    console.log(response2.headers.get('Content-Disposition'));
    console.log(response2.headers.get('Content-Type'));

    const response3 = await fetch('http://localhost:13333/test3');
    console.log(response3.headers.get('Content-Disposition'));
    console.log(response3.headers.get('Content-Type'));

    const response4 = await fetch('http://localhost:13333/test4');
    console.log(response4.headers.get('Content-Disposition'));
    console.log(response4.headers.get('Content-Type'));
    process.exit(0);
});