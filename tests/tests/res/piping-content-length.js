// must support piping into res with content-length header

const express = require("express");
const fs = require("fs");

const app = express();

app.get('/test', (req, res) => {
    if(!fs.existsSync('./src/router.js')) {
        throw new Error('File not found');
    }

    const stat = fs.statSync('./src/router.js');
    const file = fs.createReadStream('./src/router.js');
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