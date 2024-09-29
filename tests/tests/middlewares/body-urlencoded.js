// must support urlencoded body parser

const express = require("express");
const bodyParser = require("body-parser");

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));

app.post('/abc', (req, res) => {
    res.send(req.body);
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const response = await fetch('http://localhost:13333/abc', {
        method: 'POST',
        body: 'abc=123&a[b]=456&c.c=789&c.d=101112',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    });

    const text = await response.text();
    console.log(text);

    process.exit(0);

});