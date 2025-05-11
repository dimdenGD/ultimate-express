// must support urlencoded body parser

const express = require("express");
const { fetchTest } = require("../../utils");

const app = express();
app.set("etag", false);

app.post('/abc', express.urlencoded({ extended: false }), (req, res) => {
    res.send(req.body);
});

app.post('/def', express.urlencoded({ extended: true }), (req, res) => {
    res.send(req.body);
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const response = await fetchTest('http://localhost:13333/abc', {
        method: 'POST',
        body: 'abc=123&a[b]=456&c.c=789&c.d=101112',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    });

    const text = await response.text();
    console.log(text);

    const response2 = await fetchTest('http://localhost:13333/def', {
        method: 'POST',
        body: 'abc=123&a[b]=456&c.c=789&c.d=101112',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    });

    const text2 = await response2.text();
    console.log(text2);
    process.exit(0);

});