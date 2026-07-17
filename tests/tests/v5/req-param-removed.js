// v5 req.param() must be removed
// SKIP_V4: req.param() removed in Express 5

const express = require("express");

const app = express({ version: 5 });

app.get('/test/:id', (req, res) => {
    let threw = false;
    try {
        req.param('id');
    } catch (e) {
        threw = true;
    }
    res.send('threw: ' + threw);
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const response = await fetch('http://localhost:13333/test/42').then(res => res.text());
    console.log(response);
    process.exit(0);
});
