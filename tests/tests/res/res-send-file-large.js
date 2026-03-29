// must support res.sendFile() with large file

const express = require("express");
const fs = require("node:fs/promises");

const app = express();

app.get('/test', (req, res) => {
    res.sendFile('tests/parts/large-file.json', { root: "." });
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const file = await fs.readFile('tests/parts/large-file.json');

    const response = await fetch('http://localhost:13333/test');
    console.log(response.headers.get('Content-Type').toLowerCase(), response.headers.get('Content-Length'));
    console.log(file.length === Number(response.headers.get('Content-Length')));
    console.log(file.equals(await response.bytes()));

    process.exit(0);
});