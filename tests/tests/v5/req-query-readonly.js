// v5 req.query must be read-only (assignment silently ignored)
// SKIP_V4: Express 5 makes req.query a read-only getter

const express = require("express");

const app = express({ version: 5 });

app.get('/test', (req, res) => {
    const origQuery = JSON.stringify(req.query);
    let threw = false;
    try {
        req.query = { custom: 'value' };
    } catch (e) {
        threw = true;
    }
    const afterQuery = JSON.stringify(req.query);
    res.json({ threw, origQuery, afterQuery, changed: origQuery !== afterQuery });
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const response = await fetch('http://localhost:13333/test?a=1').then(res => res.text());
    console.log(response);
    process.exit(0);
});
