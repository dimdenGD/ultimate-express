// must support body parser type

const express = require("express");
const { fetchTest } = require("../../utils");

const app = express();

app.post('/abc', express.json({ type: 'application/test' }),  (req, res) => {
    res.send(req.body);
});

app.post('/def', express.json({ type: (req) => {
    console.log(req.headers['content-type']);
    return req.headers['content-type'] === 'application/test';
} }),  (req, res) => {
    res.send(req.body);
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const response = await fetchTest('http://localhost:13333/abc', {
        method: 'POST',
        body: JSON.stringify({
            abc: 123
        }),
        headers: {
            'Content-Type': 'application/json'
        }
    });
    const text = await response.text();
    console.log(response.headers.get('content-type'));
    console.log(text);

    const response2 = await fetchTest('http://localhost:13333/abc', {
        method: 'POST',
        body: JSON.stringify({
            abc: 123
        }),
        headers: {
            'Content-Type': 'application/test'
        }
    });
    const text2 = await response2.text();
    console.log(response2.headers.get('content-type'));
    console.log(text2);

    const response3 = await fetchTest('http://localhost:13333/def', {
        method: 'POST',
        body: JSON.stringify({
            abc: 123
        }),
        headers: {
            'Content-Type': 'application/test'
        }
    });
    const text3 = await response3.text();
    console.log(response3.headers.get('content-type'));
    console.log(text3);

    process.exit(0);

});