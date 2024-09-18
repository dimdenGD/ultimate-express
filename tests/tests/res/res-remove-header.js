// must support res.removeHeader()

const express = require("express");

const app = express();

app.get('/test', (req, res) => {
    res.set('X-Test', 'test');
    res.removeHeader('X-Test');
    res.send('ok');
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const response = await fetch('http://localhost:13333/test');
    console.log(response.headers.get('X-Test'));
    process.exit(0);
});