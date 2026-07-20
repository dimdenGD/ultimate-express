// v5 req.host must include the port number
// SKIP_V4: Express 5 changed req.host to include port

const express = require("express");

const app = express({ version: 5 });

app.get('/test', (req, res) => {
    res.send(req.host || 'undefined');
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const response = await fetch('http://localhost:13333/test', {
        headers: { 'Host': 'example.com:8080' }
    }).then(res => res.text());
    console.log(response);

    const response2 = await fetch('http://localhost:13333/test', {
        headers: { 'Host': 'example.com' }
    }).then(res => res.text());
    console.log(response2);

    process.exit(0);
});
