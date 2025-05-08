// must support res.links()

const express = require("express");

const app = express();

app.use(require("../../middleware"));

app.get('/test', (req, res) => {
    res.links({
        'next': 'http://api.example.com/users?page=2',
        'last': 'http://api.example.com/users?page=5',
    });
    res.send('ok');
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const response = await fetch('http://localhost:13333/test');
    console.log(response.headers.get('Link'));
    process.exit(0);
});