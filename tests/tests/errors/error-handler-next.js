// must support next() in error handler

const express = require("express");

const app = express();

app.get('/test', (req, res) => {
    throw new Error('test');
});

app.use((err, req, res, next) => {
    console.log('error1');
    next();
});

app.use((req, res, next) => {
    console.log('normal middleware');
    next();
});

app.get('/test2', (req, res) => {
    throw new Error('test');
});

app.use((err, req, res, next) => {
    console.log('error2');
    next();
});


app.use((err, req, res, next) => {
    console.log('error3');
    res.status(400).json({ error: 'test3' });
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const response = await fetch('http://localhost:13333/test');
    console.log(response.status, await response.text());
    const response2 = await fetch('http://localhost:13333/test2');
    console.log(response2.status, await response2.text());
    process.exit(0);
});