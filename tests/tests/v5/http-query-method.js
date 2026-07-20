// v5 must support HTTP QUERY method (RFC 10008)
// SKIP_V4: HTTP QUERY method support added in Express 5

const express = require("express");

const app = express({ version: 5 });
app.use(express.json());

app.query('/search', (req, res) => {
    res.json({ method: req.method, body: req.body });
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const r1 = await fetch('http://localhost:13333/search', {
        method: 'QUERY',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filter: 'active', limit: 10 })
    }).then(res => res.text());
    console.log(r1);

    process.exit(0);
});
