// must support disable

const express = require("express");

const app = express();

app.use(require("../../middleware")); 

app.disable('etag');

app.get('/abc', (req, res) => {
    res.send('abc');
});

app.listen(13333, async () => {
    const output = await fetch('http://localhost:13333/abc');
    console.log(output.headers.get('etag'));
    process.exit(0);
});