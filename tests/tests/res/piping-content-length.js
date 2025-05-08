// must support piping into res with content-length header

const express = require("express");
const fs = require("fs");

const app = express();

app.use(require("../../middleware"));

app.get('/test', (req, res) => {
    if(!fs.existsSync('./tests/parts/huge.jpg')) {
        throw new Error('File not found');
    }

    const stat = fs.statSync('./tests/parts/huge.jpg');
    const file = fs.createReadStream('./tests/parts/huge.jpg');
    res.setHeader('Content-Length', stat.size);
    file.pipe(res);
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const response = await fetch('http://localhost:13333/test');
    const text = await response.text();
    console.log(text.slice(0, 100), text.length, response.headers.get('Content-Length'));
    process.exit(0);
});