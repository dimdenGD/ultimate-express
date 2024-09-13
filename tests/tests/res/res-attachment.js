// must support res.attachment()

import express from "express";

const app = express();

app.get('/test', (req, res) => {
    res.attachment('test.png');
    res.send('test');
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const response = await fetch('http://localhost:13333/test');
    console.log(response.headers.get('Content-Disposition'));
    console.log(response.headers.get('Content-Type').split(';')[0]);
    process.exit(0);
});