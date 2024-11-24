// must support app chaining

const express = require("express");

const app = express();
app.disable('etag');

app.use((req, res, next) => {
    res.setHeader('a', '1')
    next();
}).use((req, res, next) => {
    res.setHeader('b', '1')
    next();
})

app.get('/abc', (req, res) => {
    res.send('abc');
});

app.listen(13333, async () => {
    const output = await fetch('http://localhost:13333/abc');
    console.log(output.headers.get('etag'));
    process.exit(0);
});