// must support error handler as second callback in use()

const express = require("express");

const app = express();

app.use(require("../../middleware"));

app.set('env', 'production');

app.get('/test1', (req, res) => {
    throw new Error('test1');
});

app.use((req, res, next) => {
    if(req.path === '/test2') {
        next(new Error('test'));
    } else {
        next();
    }
}, (err, req, res, next) => {
    console.log('error1');
    res.status(400).json({ error: 'test' });
});

app.get('/test3', (req, res) => {
    next(new Error('test'));
});

app.use((err, req, res, next) => {
    console.log('error2');
    res.status(400).json({ error: 'test2' });
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const response = await fetch('http://localhost:13333/test1');
    console.log(response.status, await response.text());
    const response2 = await fetch('http://localhost:13333/test2');
    console.log(response2.status, await response2.text());
    const response3 = await fetch('http://localhost:13333/test3');
    console.log(response3.status, await response3.text());

    process.exit(0);
});