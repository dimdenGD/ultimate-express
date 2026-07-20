// v5 express.urlencoded() must default to extended:false
// SKIP_V4: Express 5 changed urlencoded default extended to false

const express = require("express");

const app = express({ version: 5 });
app.use(express.urlencoded());

app.post('/test', (req, res) => {
    res.json(req.body);
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    // With extended:false, nested objects/arrays are not parsed
    const response = await fetch('http://localhost:13333/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'name=test&value=123'
    }).then(res => res.text());
    console.log(response);

    // Nested syntax should not be parsed with simple parser
    const response2 = await fetch('http://localhost:13333/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'a[b]=c&a[d]=e'
    }).then(res => res.text());
    console.log(response2);

    process.exit(0);
});
