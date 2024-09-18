// must support array app.param

const express = require("express");

const app = express();

app.param(['id', 'id2'], (req, res, next, value, key) => {
    console.log('CALLED ONLY ONCE', value, key);
    next();
});

app.get('/user/:id', (req, res) => {
    res.send('user');
});

app.get('/test/:id2', (req, res) => {
    res.send('test');
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const response = await fetch('http://localhost:13333/user/123');
    console.log(response.status);
    const response2 = await fetch('http://localhost:13333/test/123');
    console.log(response2.status);
    const response3 = await fetch('http://localhost:13333/user/555');
    console.log(response3.status);
    process.exit(0);
});