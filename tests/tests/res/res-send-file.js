// must support res.sendFile() res-send-file

const express = require("express");

const app = express();

// app.use(require("../../middleware"));

app.set("etag fn", false);

app.get('/test', (req, res) => {
    res.sendFile('src/index.js', { root: "." });
});

app.get('/dot-file', (req, res) => {
    res.sendFile('/.gitignore', { root: ".", dotfiles:'allow' });
});

app.get('/e-tag', (req, res) => {
    res.sendFile('src/index.js', { root: ".", etag: () => 'xxx' });
});


app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    let response = await fetch('http://localhost:13333/test');
    console.log(await response.text(), response.headers.get('Content-Type').toLowerCase(), response.headers.get('etag')?.toLowerCase());

    response = await fetch('http://localhost:13333/dot-file');
    console.log(await response.text(), response.headers.get('Content-Type').toLowerCase(), response.headers.get('etag')?.toLowerCase());

    response = await fetch('http://localhost:13333/e-tag');
    console.log(await response.text(), response.headers.get('Content-Type').toLowerCase(), response.headers.get('etag')?.toLowerCase());
    process.exit(0);
});