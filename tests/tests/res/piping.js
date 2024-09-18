// must support piping into res

const express = require("express");
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

    const response = await fetch('http://localhost:13333/test').then(res => res.text());
    console.log(response.slice(0, 100), response.length);
    process.exit(0);
});