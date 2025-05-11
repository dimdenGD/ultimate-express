// must support piping into res

const express = require("express");
const { fetchTest } = require("../../utils");
const fs = require("fs");

const app = express();

app.get('/test', (req, res) => {
    if(!fs.existsSync('./src/router.js')) {
        throw new Error('File not found');
    }

    const file = fs.createReadStream('./src/router.js');
    file.pipe(res);
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const response = await fetchTest('http://localhost:13333/test');
    console.log(response.headers.get('content-type'));
    const text = await response.text();
    console.log(text.slice(0, 100), text.length);
    process.exit(0);
});