// must support res.headersSent

const express = require("express");

const app = express();

app.get('/test', (req, res) => {
    console.log(res.headersSent);
    res.send('test');
    // console.log(res.headersSent);
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const response = await fetch('http://localhost:13333/test').then(res => res.text());
    process.exit(0);
});